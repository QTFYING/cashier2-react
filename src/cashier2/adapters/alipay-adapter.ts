/*
** 支付宝参数适配器
   金额：单位是元，但是必须是 字符串 类型（如 "0.01"），通常保留2位小数。
   字段名：通常叫 subject (订单标题), out_trade_no (订单号), total_amount (金额), product_code。
   透传：通常放在 passback_params (需要 UrlEncode)。
*/
import { PayParams } from '../types/protocol';
import { PaymentAdapter } from './payment-adapter';

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
      ...params.extra
    };

    // 3. 特殊处理：passback_params 需要是字符串
    // 如果用户在 extra 里传了对象，这里可以帮忙转一下
    if (payload.passback_params && typeof payload.passback_params === 'object') {
      payload.passback_params = encodeURIComponent(JSON.stringify(payload.passback_params));
    }

    return payload;
  }
}