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
  total_amount: string; // 单位：元，字符串
  product_code: string;
  body?: string;
  passback_params?: string;
  [key: string]: any;
}

export class AlipayAdapter implements PaymentAdapter<AlipayPayload> {
  // 1. 校验逻辑下沉到 Adapter
  validate(_params: PayParams): void {}

  transform(params: PayParams): AlipayPayload {
    // 1. 金额转换：保留两位小数的字符串 (e.g., 100.00)
    const totalAmount = params.amount.toFixed(2);

    // 2. 构造标准支付宝参数
    const payload: AlipayPayload = {
      // 映射描述 -> subject (支付宝必须有标题)
      subject: params.description || `Order ${params.orderId}`,

      out_trade_no: params.orderId,

      total_amount: totalAmount,

      // 默认产品码，通常由 extra 覆盖
      product_code: 'QUICK_WAP_WAY',

      // 混合 extra 参数
      ...params.extra,
    };

    // 3. 特殊处理：passback_params 需要是字符串
    // 如果用户在 extra 里传了对象，这里可以帮忙转一下
    if (payload.passback_params && typeof payload.passback_params === 'object') {
      payload.passback_params = encodeURIComponent(JSON.stringify(payload.passback_params));
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
