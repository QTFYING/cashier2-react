// src/plugins/event-bridge-plugin.ts
import type { PaymentContext } from '../core/payment-context';
import type { PaymentPlugin } from '../types';

export const EventBridgePlugin: PaymentPlugin = {
  name: 'sys-event-bridge',
  enforce: 'post', // 建议放在最后执行，确保前面的插件没报错

  onBeforePay(ctx) {
    const bus = ctx.context as PaymentContext;
    bus.emit('beforePay', ctx.params);
  },

  onBeforeInvoke(ctx) {
    const bus = ctx.context as PaymentContext;
    bus.emit('payStart', { strategyName: 'unknown' }); // 此时可能需要从 ctx 获取 strategyName
  },

  onStateChange(ctx, _result) {
    const bus = ctx.context as PaymentContext;
    bus.emit('statusChange', { status: ctx.state.status, result: ctx.result });
  },

  onSuccess(ctx, result) {
    const bus = ctx.context as PaymentContext;
    bus.emit('success', result);
  },

  onFail(ctx, error) {
    const bus = ctx.context as PaymentContext;
    // 区分是 cancel 还是 fail
    if (error instanceof Error && error.message.includes('cancel')) {
      bus.emit('cancel', { status: ctx.state.status });
    } else {
      bus.emit('fail', { status: ctx.state.status });
    }
  },
};
