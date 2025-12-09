import { PayError } from '../core/payment-error';
import { type PaymentInvoker, type PayResult, PayErrorCode } from '../types';

// 声明支付宝全局对象
declare const my: any;

export class AlipayMiniInvoker implements PaymentInvoker {
  constructor(private channel: string) {}

  async invoke(payload: any): Promise<PayResult> {
    return new Promise((resolve, reject) => {
      if (typeof my === 'undefined' || !my.tradePay) {
        reject(new PayError(PayErrorCode.NOT_SUPPORTED, 'my.tradePay is not available', 'alipay-mini'));
        return;
      }

      console.log('[AlipayMiniInvoker] Calling my.tradePay');

      // 支付宝小程序支付
      my.tradePay({
        // 支付宝通常只需要一个交易号，或者是一个完整的 orderStr
        tradeNO: payload.tradeNO || payload.orderStr || payload,

        success: (res: any) => {
          // 支付宝文档：resultCode 9000 代表成功
          if (res.resultCode === '9000') {
            resolve({
              status: 'success',
              raw: res,
              transactionId: payload.tradeNO, // 尽量回填单号
              message: 'Alipay Mini Success',
            });
          } else if (res.resultCode === '6001') {
            resolve({ status: 'cancel', message: 'User cancelled', raw: res });
          } else {
            // 其他错误码视为失败
            reject(new PayError(PayErrorCode.PROVIDER_INTERNAL_ERROR, `Alipay Error: ${res.resultCode}`, 'alipay-mini'));
          }
        },
        fail: (err: any) => {
          reject(new PayError(PayErrorCode.PROVIDER_INTERNAL_ERROR, err.errorMessage || 'Alipay System Error', 'alipay-mini'));
        },
      });
    });
  }
}
