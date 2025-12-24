/*
** 支付宝参数适配器
   金额：单位是元，但是必须是 字符串 类型（如 "0.01"），通常保留2位小数。
   字段名：通常叫 subject (订单标题), out_trade_no (订单号), total_amount (金额), product_code。
   透传：通常放在 passback_params (需要 UrlEncode)。
*/
import type { PayParams, PayResult } from '../types';
import type { PaymentAdapter } from './payment-adapter';
import type { AlipayPayload } from './types';

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

    // 兼容非json格式的，如form表单、二维码等
    if (!rawResult) return { status: 'pending', message: '等待支付中' };

    if (code === '9000') {
      // "9000" 代表支付成功
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
