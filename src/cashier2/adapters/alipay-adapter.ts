/*
** 支付宝参数适配器
   金额：单位是元，但是必须是 字符串 类型（如 "0.01"），通常保留2位小数。
   字段名：通常叫 subject (订单标题), out_trade_no (订单号), total_amount (金额), product_code。
   透传：通常放在 passback_params (需要 UrlEncode)。
*/
import type { PayParams, PayResult } from '../types';
import type { PaymentAdapter } from './payment-adapter';

// 定义支付宝(统一收单接口)的数据结构
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

export class AlipayAdapter implements PaymentAdapter<AlipayPayload, any> {
  // 1. 校验逻辑下沉到 Adapter
  validate(_params: PayParams): void {}

  transform(params: PayParams): AlipayPayload {
    // 1. 默认处理
    const payload: AlipayPayload = {
      subject: params.description || 'Order Payment',
      out_trade_no: params.orderId,
      total_amount: params.amount.toFixed(2), // 支付宝必须是两位小数的字符串
      product_code: 'QUICK_WAP_WAY', // 默认给手机网页支付
      ...params.extra, // 允许覆盖
    };

    // 2. 根据场景智能匹配 product_code (如果用户没传)
    if (!payload.product_code) {
      if (params.extra?.mode === 'app') {
        payload.product_code = 'QUICK_MSECURITY_PAY'; // APP 支付
      } else if (params.extra?.mode === 'pc') {
        payload.product_code = 'FAST_INSTANT_TRADE_PAY'; // 电脑网站支付
      } else if (params.extra?.mode === 'qr') {
        payload.product_code = 'FACE_TO_FACE_PAYMENT'; // 当面付
      }
    }

    return payload;
  }

  normalize(rawResult: any): PayResult {
    // 支付宝有些端返回 resultCode，有些返回 resultStatus
    const code = rawResult?.resultCode || rawResult?.resultStatus;

    // "9000" 代表支付成功
    if (code === '9000') {
      return { status: 'success', raw: rawResult };
    }

    // "6001" 代表用户中途取消
    if (code === '6001') {
      return { status: 'cancel', message: 'User cancelled', raw: rawResult };
    }

    // "8000" 代表正在处理中 (很少见，但也算一种 pending)
    if (code === '8000') {
      return { status: 'processing', message: 'Payment processing', raw: rawResult };
    }

    // 其他都是失败
    return {
      status: 'fail',
      message: rawResult?.memo || `Alipay Error: ${code}`,
      raw: rawResult,
    };
  }
}
