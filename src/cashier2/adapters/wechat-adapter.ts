/*
** 微信支付参数适配器
   金额：单位是分 (Int)，不能有小数点。
   字段名：通常叫 body (商品描述), out_trade_no (订单号), total_fee (金额), spbill_create_ip (IP)。
   附加数据：通常放在 attach 字段
*/
import { PayError } from '../core/payment-error';
import { PayErrorCode } from '../types';
import { PayParams, PayResult } from '../types/protocol';
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
  // 1. 校验传入参数
  validate(params: PayParams): void {
    if (!params.orderId) {
      throw new PayError(PayErrorCode.PARAM_INVALID, 'Missing orderId', 'wechat');
    }
    // 微信 JSAPI 支付特定校验
    if (params.extra?.trade_type === 'JSAPI' && !params.extra?.openid) {
      throw new PayError(PayErrorCode.PARAM_INVALID, 'JSAPI payment requires openid', 'wechat');
    }
  }


  /* 统一支付需要的参数
    {
      "appid": "wxd678efh567hg6787",
      "mch_id": "1230000109",
      "nonce_str": "5K8264ILTKCH16CQ2502SI8ZNMTM67VS",
      "sign": "C380BEC2BFD727A4B6845133519F3AD6",
      "body": "商品描述",
      "out_trade_no": "20150806125346",
      "total_fee": 100,       // 单位：分（100 = 1元）
      "spbill_create_ip": "123.12.12.123",
      "notify_url": "https://yourdomain.com/wechatpay/notify",
      "trade_type": "JSAPI",
      "openid": "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o"  // 仅 JSAPI 支付需要，其他类型（如 Native）不用填
    }
  */

  transform(params: PayParams): WechatPayload {
    return {
      body: (params.description || '商品支付').substring(0, 127), // 自动截断
      out_trade_no: params.orderId,
      total_fee: Math.round(params.amount * 100), // 元转分
      ...params.extra // 透传高级参数
    };
  }

  normalize(rawResult: any): PayResult {
    // 这种松散的检查反而更健壮
    const msg = rawResult?.errMsg || rawResult?.err_msg || '';
    const code = rawResult?.err_code || rawResult?.resultCode || '';

    // 模糊匹配
    if (/ok|success/i.test(msg) || code === '0' || code === '9000') {
      return { status: 'success', raw: rawResult };
    }

    if (/cancel|取消/i.test(msg) || code === '6001') {
      return { status: 'cancel', raw: rawResult };
    }

    return { status: 'fail', message: msg, raw: rawResult };
  }
}
