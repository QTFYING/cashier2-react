import type { PayResult } from '../types'; // 注意调整引用路径

/**
 * 支付执行器接口
 * 负责将"签名后的数据"发送给底层 SDK
 * 高级用户可以通过实现此接口来支持新的平台（如 TikTok, Stripe）
 */
export type PayPlatformType = 'wechat' | 'alipay' | 'unionpay' | 'other';

export type InvokerType = 'uniapp' | 'web' | 'wechat-mini' | 'alipay-mini' | string;

export interface PaymentInvoker {
  invoke(payload: any): Promise<PayResult>;
}
