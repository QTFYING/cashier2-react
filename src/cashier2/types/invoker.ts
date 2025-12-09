import type { PayResult } from './protocol';

/**
 * 支付执行器接口
 * 负责将"签名后的数据"发送给底层 SDK
 */
export interface PaymentInvoker {
  invoke(payload: any): Promise<PayResult>;
}
