import type { HttpClient, PayParams, PayResult, PaySt } from '../types';
import type { StrategyOptions } from '../types/protocol';

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
   * 阶段1：准备支付 (后端签名)
   * 负责拼装参数并请求服务端获取签名后的 Payload
   */
  abstract prepare(params: PayParams, http: HttpClient): Promise<any>;

  /**
   * 阶段3：处理结果 (归一化)
   * 负责将 Invoker 返回的原始结果转为标准 PayResult
   */
  abstract process(rawResult: any): PayResult;

  /**
   * 查询订单的支付状态
   * @param { String } orderId 订单id
   */

  abstract getPaySt(orderId: string): Promise<PayResult>;

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
