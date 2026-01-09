import { InvokerFactory } from './core/invoker-factory';
import { type PayParams, type PayResult, BaseStrategy } from './index';

// 1. 定义专属执行器
class StripeInvoker {
  async invoke(payload: any) {
    // 调用 Stripe 官方的前端 SDK
    console.log('[StripeInvoker] Intecepted via custom launcher');
    const { error, paymentIntent } = await (window as any).Stripe('pk_test_xxx').confirmCardPayment(payload.client_secret);

    if (error) throw new Error(error.message);
    return paymentIntent;
  }
}

// 2. 注册执行器 (自举)
// 这里的 'stripe' 对应 PaymentChannelEnum.STRIPE 或策略名
// 优先级设为 99 (比 mock 高)
InvokerFactory.register('stripe', StripeInvoker as any, () => true, 99);

export class StripeStrategy extends BaseStrategy {
  readonly name = 'stripe';

  // 阶段1: 准备 (后端)
  async prepare(params: PayParams): Promise<any> {
    // 调用后端创建 PaymentIntent
    const intent = await this.context.request('post', '/api/stripe/create-intent', {
      amount: params.amount,
      currency: params.currency,
    });
    return intent;
  }

  // 阶段3: 处理 (归一化)
  process(rawResult: any): PayResult {
    return {
      status: 'success',
      transactionId: rawResult.id,
      raw: rawResult,
    };
  }

  // 这里的 pay 方法必须删除，因为基类已经删除了
  // async pay... ❌

  async getPaySt(orderId: string): Promise<PayResult> {
    const res = await this.context.request('get', `/api/stripe/query?id=${orderId}`);
    return { status: res.status, raw: res };
  }
}
