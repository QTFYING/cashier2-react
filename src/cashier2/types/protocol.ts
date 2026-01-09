/**
 * 核心业务模型 (Params, Result, Enum)
 * 负责定义
 * - 入参 (Params)
 * - 结果 (Result)
 * - 枚举 (Enum)
 */

/**
 * 统一支付结果状态
 * 用于表示支付的最终结果状态
 * fail 失败
 * cancel 取消
 * success 成功
 * pending 待支付
 * processing 处理中
 */
export type PaySt = 'pending' | 'processing' | 'success' | 'fail' | 'cancel';

/**
 * 定义支持的支付渠道
 */
export type PaymentChannel = 'wechat' | 'alipay' | 'stripe' | 'custom';

/**
 * 统一支付入参
 * 业务层调用 SDK 时只需要关注这些字段
 */
export interface PayParams {
  autoPoll?: boolean; // 是否自动轮询
  orderId: string; // 你的业务侧订单号
  amount: number; // 金额（建议统一单位：分）
  currency?: string; // 币种，默认 CNY
  description?: string; // 商品描述
  /**
   * 扩展字段：用于透传某些渠道特有的参数
   * 例如：微信可能需要 openid，支付宝可能需要 return_url
   */
  extra?: Record<string, any>;
}

export type PaymentActionType = 'qrcode' | 'url_jump' | 'none';

export interface PaymentAction {
  type: PaymentActionType;
  value: string; // 二维码的内容 或 跳转的 URL
}

/**
 * 统一支付结果
 * 屏蔽了具体 SDK (微信/支付宝) 的返回差异
 */
export interface PayResult {
  status: PaySt;
  transactionId?: string; // 第三方流水号 (Wechat Transaction ID / Alipay Trade No)
  message?: string; // 描述信息
  raw?: any; // 原始返回数据 (作为逃生舱，方便调试)
  action?: PaymentAction; // 扫码或跳转时才有
}

/**
 * 策略的基本配置接口
 */
export interface StrategyOptions {
  name?: string; // 允许覆盖默认策略名
  debug?: boolean;
  mock?: boolean; // 开启 Mock 模式
}
