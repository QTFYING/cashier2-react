import { EventBridgePlugin } from '../plugins/event-bridge-plugin';
import type { BaseStrategy } from '../strategies/base-strategy';
import type { HttpClient, PaymentContextState, PaymentPlugin, PayParams, PayResult } from '../types';
import { PayErrorCode } from '../types';
import { createDefaultFetcher } from '../utils/fetcher';
import { EventBus } from './event-bus';
import type { InvokerType } from './invoker-factory';
import { PayError } from './payment-error';
import { PluginDriver } from './plugin-driver';
import { PollingManager } from './polling-manager';

export interface SDKConfig {
  debug?: boolean;
  http?: HttpClient; // 依赖注入
  invokerType?: InvokerType;
}

export class PaymentContext extends EventBus {
  // [核心] 1. 策略池
  private strategies: Map<string, BaseStrategy> = new Map();

  // [核心] 2. 插件池 (替代 Middlewares)
  private plugins: PaymentPlugin[] = [];

  // [核心] 3. HTTP 客户端 (依赖注入)
  public readonly http: HttpClient;

  // [新增] 轮询管理器 (组合模式)
  private pollingManager: PollingManager;

  // 插件分发器
  public driver: PluginDriver;

  // 通过谁拉起支付控件
  public readonly invokerType: SDKConfig['invokerType'];

  // 存个上下文，防止在轮询等待期间数据丢失
  private _lastContextState: Record<string, any> = {} as PaymentContextState;

  constructor(config: SDKConfig = {}) {
    super();

    const { http, invokerType } = config ?? {};
    this.http = http ?? createDefaultFetcher();
    this.driver = new PluginDriver(this.plugins || []);
    // 初始化轮询管理器，并将 this 传给它
    this.pollingManager = new PollingManager(this);
    this.invokerType = invokerType;
    // [关键] 注册内置的事件桥接插件
    this.use(EventBridgePlugin);
  }

  /**
   * 注册策略 (use Strategy)
   */
  register(strategy: BaseStrategy): this {
    strategy.context = this;
    if (this.strategies.has(strategy.name)) {
      console.warn(`[PaymentContext] Strategy "${strategy.name}" overwritten.`);
    }
    this.strategies.set(strategy.name, strategy);
    return this;
  }

  /**
   * 注册插件 (use Plugin)
   */
  use(plugin: PaymentPlugin): this {
    plugin.enforce === 'pre' ? this.plugins.unshift(plugin) : this.plugins.push(plugin);
    return this;
  }

  /**
   * 核心执行器
   */
  async execute(strategyName: string, params: PayParams): Promise<PayResult> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new PayError(PayErrorCode.INVALID_CONFIG, `Strategy "${strategyName}" not registered.`);
    }

    // 0. 初始化运行时上下文
    const ctx: PaymentContextState = { context: this, params, state: {} };

    try {
      // --- Stage 1: 准备 (Bootstrap) ---
      // 场景：参数校验、权限检查、Loading 开启
      await this.driver.implant('onBeforePay', ctx);

      // --- Stage 2: 交互 (Negotiation) ---
      // 场景：Token 注入、URL 修改、签名
      await this.driver.implant('onBeforeSign', ctx);

      // 注意：Strategy 内部此时会调用 this.context.request 去请求后端
      await this.driver.implant('onAfterSign', ctx);

      // --- Stage 3: 适配 (Adaptation) ---
      // 场景：埋点上报、动态加载 JS-SDK 脚本
      await this.driver.implant('onBeforeInvoke', ctx);

      // --- Stage 4: 执行 (Execution) ---
      // 执行真实的支付逻辑 (Strategy.pay)
      const result = await strategy.pay(ctx.params, this.http, this.invokerType);
      ctx.result = result;

      // Stage 5: Settlement
      if (result.status === 'success') {
        await this.driver.implant('onSuccess', ctx, result);
      } else if (result.status === 'pending' || result.status === 'processing') {
        await this.driver.implant('onStateChange', ctx, result);
      } else {
        await this.driver.implant('onFail', ctx, result);
      }

      // [关键] 成功返回前，存档！
      this._lastContextState = ctx.state;
      return result;
    } catch (error: any) {
      // 归一化错误
      const errResult = error instanceof PayError ? error : new PayError(PayErrorCode.UNKNOWN, error.message || 'Unknown Error');

      await this.driver.implant('onFail', ctx, errResult);

      // [关键] 出错也要存档
      this._lastContextState = ctx.state;
      throw errResult;
    } finally {
      await this.driver.implant('onCompleted', ctx);
    }
  }

  // --- 轮询代理方法 (Delegation) ---

  /**
   * 手动开启轮询
   * 实际逻辑委托给 pollingManager
   */
  public startPolling(strategyName: string, orderId: string) {
    this.pollingManager.start(strategyName, orderId);
  }

  public stopPolling() {
    this.pollingManager.stop();
  }

  // --- 暴露给 PollingManager 的内部能力 (Internal APIs) ---

  /**
   * 获取指定策略
   */
  public getStrategy(name: string): BaseStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * 获取最近一次的上下文状态 (用于状态恢复)
   */
  public getLastContextState(): Record<string, any> {
    return this._lastContextState;
  }
}
