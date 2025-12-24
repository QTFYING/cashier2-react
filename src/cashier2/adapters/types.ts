/**
 *  定义支付宝(统一收单接口)的数据结构
 */
export interface AlipayPayload {
  subject: string;
  out_trade_no: string;
  total_amount: string;
  /**
   * 支付方式：
   * QUICK_MSECURITY_PAY：APP 支付
   * QUICK_WAP_WAY：手机网页支付
   * FAST_INSTANT_TRADE_PAY：电脑网站支付
   * FACE_TO_FACE_PAYMENT：当面付
   */
  product_code: 'QUICK_WAP_WAY' | 'QUICK_MSECURITY_PAY' | 'FAST_INSTANT_TRADE_PAY' | 'FACE_TO_FACE_PAYMENT'; // <--- 关键字段，决定了是 Wap 还是 App
  body?: string;
  // ... 其他参数
  [key: string]: any;
}

/**
 * 定义微信(统一下单接口)的数据结构
 */
export interface WechatPayload {
  body: string; // 商品描述
  out_trade_no: string; // 订单号
  total_fee: number; // 金额 单位：分
  spbill_create_ip?: string; // IP
  notify_url?: string;
  /**
   * 支付方式：
   * JSAPI：浏览器端支付（微信内打开）
   * MWEB：H5 支付（浏览器打开）
   * NATIVE：扫码支付（生成二维码）
   */
  trade_type?: 'JSAPI' | 'MWEB' | 'NATIVE';
  attach?: string;
  openid?: string;
  [key: string]: any; // 允许扩展
}
