import { PayError, type PaymentInvoker } from '@my-cashier/core';
import { PayErrorCode } from '@my-cashier/types';

// 声明全局变量 tt (字节跳动小程序的全局对象)
declare const tt: any;

export class TiktokInvoker implements PaymentInvoker {
  private channel: string;

  constructor(channel: string) {
    this.channel = channel;
  }

  async invoke(payload: any): Promise<any> {
    console.log(`[TikTokInvoker] Start invoking payment: ${this.channel}`, payload);

    return new Promise((resolve, reject) => {
      // 1. 检查环境
      if (typeof tt === 'undefined' || !tt.pay) {
        reject(new PayError(PayErrorCode.NOT_SUPPORTED, '当前不在抖音/TikTok小程序环境'));
        return;
      }

      // 2. 调用抖音原生支付 API
      // 这里的参数结构取决于抖音文档，通常是服务端下发的 params
      tt.pay({
        orderInfo: payload.data, // 假设 action.data 就是服务端下发的 orderInfo
        service: 5,
        getOrderStatus: (_res: any) => {
          return new Promise((resolve) => {
            // 这里可能需要调用自己的后端查询结果
            resolve({ code: 0 });
          });
        },
        success: (res: any) => {
          if (res.code === 0) {
            resolve({ status: 'success', raw: res });
          } else {
            reject(new PayError(PayErrorCode.UNKNOWN, res.msg || '支付失败'));
          }
        },
        fail: (err: any) => {
          // 区分用户取消和系统错误
          if (err.errMsg && err.errMsg.indexOf('cancel') > -1) {
            reject(new PayError(PayErrorCode.USER_CANCEL, '用户取消支付'));
          } else {
            reject(new PayError(PayErrorCode.UNKNOWN, err.errMsg));
          }
        },
      });
    });
  }
}
