/**
 * 渠道专用数据结构定义
 * 仅用于 Adapter 内部实现或高级调试，不需要暴露给 SDK 根目录
 */

/**
 * 支付宝支付方式：
 * QUICK_MSECURITY_PAY：APP 支付
 * QUICK_WAP_WAY：手机网页支付
 * FAST_INSTANT_TRADE_PAY：电脑网站支付
 * FACE_TO_FACE_PAYMENT：当面付
 */
export type AlipayProductCode = 'QUICK_WAP_WAY' | 'QUICK_MSECURITY_PAY' | 'FAST_INSTANT_TRADE_PAY' | 'FACE_TO_FACE_PAYMENT';

export interface AlipayPayload {
  subject: string;
  out_trade_no: string;
  total_amount: string;
  /** 关键字段，决定了是 Wap 还是 App */
  product_code: AlipayProductCode;
  body?: string;
  // ... 其他参数
  [key: string]: any;
}

/**
 * 微信支付方式：
 * JSAPI：浏览器端支付（微信内打开）
 * MWEB：H5 支付（浏览器打开）
 * NATIVE：扫码支付（生成二维码）
 */
export type WechatProductCode = 'JSAPI' | 'MWEB' | 'NATIVE';

// 微信统一下单参数
export interface WechatPayload {
  body: string; // 商品描述
  out_trade_no: string; // 订单号
  total_fee: number; // 金额 单位：分
  spbill_create_ip?: string; // IP
  notify_url?: string;
  trade_type?: WechatProductCode;
  attach?: string;
  openid?: string;
  [key: string]: any; // 允许扩展
}
