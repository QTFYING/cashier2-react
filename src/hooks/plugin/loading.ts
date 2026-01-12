import type { PaymentPlugin } from '@my-cashier/core';

export const LoadingPlugin: PaymentPlugin = {
  name: 'global-loading',
  onBeforePay() {
    console.log('>>> [Loading Plugin] 开启全局遮罩');
  },
  onCompleted() {
    // 无论成功失败，都在这里关闭，相当于 finally
    console.log('<<< [Loading Plugin] 关闭全局遮罩');
  },
};
