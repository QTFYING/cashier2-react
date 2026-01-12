import type { PaymentPlugin } from '@my-cashier/core';

export const LoggerPlugin: PaymentPlugin = {
  name: 'logger',
  onBeforePay(ctx) {
    ctx.state.startTime = Date.now(); // 记录开始时间
    console.log('>>> [Logger Plugin] 计时开始');
  },
  onSuccess(ctx, res) {
    const duration = Date.now() - ctx.state.startTime;
    console.log(`✅ [Logger Plugin] 支付成功! 耗时: ${duration}ms`, res.transactionId);
    // Analytics.report('PAY_SUCCESS', ...)
  },
  onFail(_ctx, _error) {
    console.log(`❌ [Logger Plugin] 支付失败/取消`);
  },
};
