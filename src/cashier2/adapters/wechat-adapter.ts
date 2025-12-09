/*
** 微信支付参数适配器
   金额：单位是分 (Int)，不能有小数点。
   字段名：通常叫 body (商品描述), out_trade_no (订单号), total_fee (金额), spbill_create_ip (IP)。
   附加数据：通常放在 attach 字段
*/
import { PayParams } from '../types/protocol';
import { PaymentAdapter } from './payment-adapter';

// 定义微信(统一下单接口)的数据结构
export interface WechatPayload {
  body: string; // 商品描述
  out_trade_no: string; // 订单号
  total_fee: number; // 金额 单位：分
  spbill_create_ip?: string; // IP
  notify_url?: string;
  trade_type?: 'JSAPI' | 'MWEB' | 'NATIVE';
  attach?: string;
  openid?: string;
  [key: string]: any; // 允许扩展
}

export class WechatAdapter implements PaymentAdapter<WechatPayload> {
  transform(params: PayParams): WechatPayload {
    // 1. 金额转换：元 -> 分 (注意 JS 浮点数精度问题)
    // 建议使用 safeMath 或简单的 Math.round 修正
    const totalFee = Math.round(params.amount * 100);

    // 2. 构造标准微信参数
    const payload: WechatPayload = {
      // 映射描述 -> body
      body: params.description || '商品支付',

      // 映射订单号 -> out_trade_no
      out_trade_no: params.orderId,

      // 映射金额
      total_fee: totalFee,

      // 处理 extra 里的透传参数
      ...params.extra
    };

    // 3. 特殊处理：截断过长的字符串 (微信 body 限制 128 字符)
    if (payload.body.length > 128) {
      payload.body = payload.body.substring(0, 125) + '...';
    }

    return payload;
  }
}