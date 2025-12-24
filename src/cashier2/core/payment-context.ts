import { EventBridgePlugin } from '../plugins/event-bridge-plugin';
import type { BaseStrategy } from '../strategies/base-strategy';
import type { HttpClient, PaymentContextState, PaymentPlugin, PayParams, PayResult, SDKConfig } from '../types';
import { PayErrorCode } from '../types';
import { createDefaultFetcher } from '../utils/fetcher';
import { EventBus } from './event-bus';
import { PayError } from './payment-error';
import { PluginDriver } from './plugin-driver';
import { PollingManager } from './polling-manager';

export class PaymentContext extends EventBus {
  // 1. 策略池
  private strategies: Map<string, BaseStrategy> = new Map();

  // 2. 插件池
  private plugins: PaymentPlugin[] = [];

  // 3. HTTP 客户端 (依赖注入)
  public readonly http: HttpClient;

  // 4. 轮询管理器
  private poller: PollingManager;

  // 5. 插件驱动器
  public driver: PluginDriver;

  // 6. 执行环境
  public readonly invokerType: SDKConfig['invokerType'];

  // 7. 上下文快照
  private _lastContextState: Record<string, any> = {} as PaymentContextState;

  // 8. 实例是否被销毁
  private _isDestroyed = false;

  constructor(config: SDKConfig = {}) {
    super();

    const { http, invokerType, plugins = [], enableDefaultPlugins = true } = config;

    // 初始化基础依赖
    this.http = http ?? createDefaultFetcher();
    this.invokerType = invokerType;
    this.poller = new PollingManager();
    this.plugins = [...plugins];

    // 处理插件
    if (enableDefaultPlugins) {
      const hasEventBridge = this.plugins.some((p) => p.name === 'EventBridgePlugin');
      if (!hasEventBridge) this.use(EventBridgePlugin);
    }

    this.driver = new PluginDriver(this.plugins || []);
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
    this.driver = new PluginDriver(this.plugins);
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
  /**
   * 手动开启轮询
   * 这里负责“组装”任务和上下文
   */
  public startPolling(strategyName: string, orderId: string) {
    // 1. 获取策略 (依然由 Context 负责)
    const strategy = this.strategies.get(strategyName);

    if (!strategy) return;

    // 2. 上下文 (Context Restoration)
    const ctx = this.createPollingContext(orderId);

    // 3. task 定义查单任务 (闭包)
    const task = async () => await strategy.getPaySt(orderId);

    // 4. 定义回调 (连接 EventBus 和 PluginDriver)
    this.poller.start(task, this.createPollingCallbacks(ctx), 3000);
  }

  public stopPolling() {
    this.poller.stop();
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

  // 创建轮询时的上下文快照
  private createPollingContext(orderId: string): PaymentContextState {
    const lastState = this.getLastContextState();
    return {
      context: this,
      params: { orderId, amount: 0 },
      state: { ...lastState },
      currentStatus: 'pending',
    };
  }

  //  轮询回调函数（Event, Plugin）收敛在这里，不污染主逻辑
  private createPollingCallbacks(ctx: PaymentContextState) {
    return {
      onStatusChange: async (res: PayResult) => {
        ctx.currentStatus = res.status;
        ctx.result = res;
        this.emit('statusChange', { status: res.status, result: res });
        await this.driver.implant('onStateChange', ctx, res.status);
      },
      onSuccess: async (res: PayResult) => {
        ctx.result = res;
        this.emit('success', res);
        await this.driver.implant('onSuccess', ctx, res);
      },
      onFail: async (res: PayResult) => {
        ctx.result = res;
        this.emit('fail', res);
        await this.driver.implant('onFail', ctx, res);
      },
      onFinished: async () => {
        await this.driver.implant('onCompleted', ctx);
      },
    };
  }

  public destroy(): void {
    if (this._isDestroyed) return;

    // 1. 停止一切正在进行的异步任务 (轮询)
    this.stopPolling();

    // 2. 清空事件总线 (EventBus)
    this.clear();

    // 3. 清空策略
    this.strategies.clear();

    // 4. 清空插件列表
    this.plugins = [];

    // 5. 清空上下文状态 & 标识位
    this._lastContextState = {};
    this._isDestroyed = true;
  }
}
