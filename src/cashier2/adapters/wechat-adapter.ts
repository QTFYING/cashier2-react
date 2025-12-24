/**
 * 微信支付参数适配器
 * 金额：单位是分 (Int)，不能有小数点。
 * 字段名：通常叫 body (商品描述), out_trade_no (订单号), total_fee (金额), spbill_create_ip (IP)。
 * 附加数据：通常放在 attach 字段
 */
import { PayError } from '../core/payment-error';
import { PayErrorCode, type PayParams, type PayResult } from '../types';
import type { PaymentAdapter } from './payment-adapter';
import type { WechatPayload } from './types';

export class WechatAdapter implements PaymentAdapter<WechatPayload> {
  // 1. 校验传入参数
  validate(params: PayParams): void {
    // 微信 JSAPI 支付特定校验
    if (params.extra?.trade_type === 'JSAPI' && !params.extra?.openid) {
      throw new PayError(PayErrorCode.PARAM_INVALID, 'JSAPI payment requires openid', 'wechat');
    }
  }

  /* 统一下单所需参数示例
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
  }  */

  /**
   * 其实微信支付设计的很鸡贼，所有支付方式都用通用的统一下单接口
   * 唯一的区别，是 trade_type，传入各支付类型的参数
   */
  transform(params: PayParams): WechatPayload {
    // 1. 默认 JSAPI，但允许 extra 覆盖
    const { tradeType = 'JSAPI', ...rest } = params.extra || {};

    // 2. 校验：JSAPI 必须有 openid
    if (tradeType === 'JSAPI' && !params.extra?.openid) {
      throw new Error('JSAPI requires openid');
    }

    // 3. 构建基础参数
    const payload = {
      body: (params.description || '商品支付').substring(0, 127), // 自动截断
      out_trade_no: params.orderId,
      total_fee: Math.round(params.amount * 100), // 元转分
      ...rest, // 透传高级参数
      trade_type: tradeType, // 核心参数
    };

    // H5 支付必填 IP，这里可能需要服务端获取
    if (tradeType === 'MWEB') {
      Object.assign(payload, { spbill_create_ip: '127.0.0.1' });
    }

    return payload;
  }

  /**
   * 其实微信支付设计的很鸡贼，所有支付方式都用通用的统一下单接口
   * 微信各种支付返回均放在rawResult中
   * Native 支付返回 rawResult 中包含 code_url
   * H5 跳转 (后端返回了 mweb_url)
   * JSAPI和小程序则统一返回标准格式
   */
  normalize(rawResult: any): PayResult {
    // 1. 识别 Invoker 透传出来的“指令动作” (如 PC 扫码、H5 跳转)

    const actionType = rawResult?.action ?? '';

    // A: 扫码，是一个中间态，需要进入轮询
    if (actionType === 'qrcode') {
      const { code, original } = rawResult;
      return { action: { type: 'qrcode', value: code }, status: 'pending', raw: original, message: '请扫描二维码支付...' };
    }

    // B: 跳转，跳转后状态未知，需进入轮询或等待回调
    if (actionType === 'url_jump') {
      const { url, original } = rawResult;
      return { action: { type: 'url_jump', value: url }, status: 'pending', raw: original, message: '正在跳转支付...' };
    }

    // C: JSAPI & Bridge
    const msg = rawResult?.errMsg || rawResult?.err_msg || '';

    // requestPayment:ok -> 小程序/UniApp
    // chooseWXPay:ok    -> 公众号 JSSDK
    // getBrandWCPayRequest:ok -> 老版本微信
    // get_brand_wcpay_request:ok -> 最新版本微信

    // 1. 支付成功
    if (['requestPayment:ok', 'chooseWXPay:ok', 'getBrandWCPayRequest:ok', 'get_brand_wcpay_request:ok'].includes(msg)) {
      return { status: 'success', raw: rawResult };
    }

    // 2. 取消支付
    if (msg.indexOf('cancel') > -1 || msg.indexOf('取消') > -1) {
      return { status: 'cancel', message: 'User cancelled', raw: rawResult };
    }

    // 3. 其他全算失败
    return { status: 'fail', message: msg || '微信支付失败', raw: rawResult };
  }
}
