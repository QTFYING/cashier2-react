import { PayError } from '../core/payment-error';
import { type PaymentInvoker, type PayResult, PayErrorCode } from '../types';

// 声明 wx 全局对象，防止 TS 报错
declare const wx: any;

export class WechatMiniInvoker implements PaymentInvoker {
  constructor(private channel: string) {}

  async invoke(payload: any): Promise<PayResult> {
    return new Promise((resolve, reject) => {
      // 防御性检测：确保 wx 对象存在
      if (typeof wx === 'undefined' || !wx.requestPayment) {
        reject(new PayError(PayErrorCode.NOT_SUPPORTED, 'wx.requestPayment is not available', 'wechat-mini'));
        return;
      }

      // 微信原生 API 调用
      wx.requestPayment({
        timeStamp: payload.timeStamp,
        nonceStr: payload.nonceStr,
        package: payload.package,
        signType: payload.signType,
        paySign: payload.paySign,

        // 成功回调
        success: (res: any) => {
          resolve({
            status: 'success',
            raw: res,
            transactionId: payload.package, // 小程序回调通常不带单号，暂用 package 里的 prepay_id 替代或留空
            message: 'Wechat payment success',
          });
        },

        // 失败回调
        fail: (err: any) => {
          // 微信原生取消通常是 errMsg: "requestPayment:fail cancel"
          if (err.errMsg && err.errMsg.indexOf('cancel') > -1) {
            resolve({ status: 'cancel', message: 'User cancelled', raw: err });
          } else {
            reject(new PayError(PayErrorCode.PROVIDER_INTERNAL_ERROR, err.errMsg || 'Wechat Mini Payment Failed', 'wechat-mini'));
          }
        },
      });
    });
  }
}
