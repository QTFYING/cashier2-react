import type { SDKConfig } from '../core/payment-context';
import type { HttpClient, PayParams, PayResult, PaySt, StrategyOptions } from '../types';

export type StateCallBack = (status: PaySt) => void;

/**
 * 策略抽象基类
 * 类似于 Passport.js 的 Strategy 类
 */
export abstract class BaseStrategy<TConfig = any> {
  // 策略名称，用于在 Context 中作为 Key (如 'wechat', 'alipay')
  public abstract readonly name: string;

  protected config: TConfig;
  protected options: StrategyOptions;
  public context?: any; // Injected by PaymentContext

  constructor(config: TConfig, options: StrategyOptions = {}) {
    this.config = config;
    this.options = options;
  }

  /**
   * 核心抽象方法：执行支付
   * 子类必须实现，负责将标准化参数交给具体渠道执行器并返回结果。
   * @param { PayParams } params 标准化的支付参数（订单号、金额等）
   * @param { HttpClient } http 注入的 HTTP 客户端，用于调用后端支付/查单接口
   * @param { PaymentInvoker } invokerType 执行器类型，用于判断在哪个环境触发支付动作
   * @param { StateCallBack } [onStateChange] 状态回调，SDK 在支付流转中更新状态时调用
   * @returns { Promise<PayResult> } 支付结果的 Promise
   */
  abstract pay(params: PayParams, http: HttpClient, invokerType: SDKConfig['invokerType']): Promise<PayResult>;

  /**
   * 查询订单的支付状态
   * @param { String } orderId 订单id
   */

  abstract getPaySt(orderId: string): Promise<PayResult>;

  /**
   * 钩子方法：参数预校验
   * 子类可以覆盖此方法，或者直接使用父类的通用校验
   */
  validateParams(params: PayParams): void {
    if (!params.orderId) {
      throw new Error(`[${this.name}] Order ID is missing.`);
    }
    if (params.amount <= 0) {
      throw new Error(`[${this.name}] Amount must be greater than 0.`);
    }
  }

  /**
   * 辅助方法：生成标准化的成功返回
   */
  protected success(transactionId: string, raw?: any): PayResult {
    return { status: 'success', transactionId, raw };
  }

  /**
   * 辅助方法：生成标准化的失败返回
   */
  protected fail(message: string, raw?: any): PayResult {
    return { status: 'fail', message, raw };
  }
}
