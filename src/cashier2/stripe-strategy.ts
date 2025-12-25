import { type PayParams, type PayResult, BaseStrategy, PayError, PayErrorCode } from './index'; // 假设你的包名

export class StripeStrategy extends BaseStrategy {
  // 1. 定义唯一名称
  readonly name = 'stripe';

  // 2. 实现核心支付逻辑
  async pay(params: PayParams): Promise<PayResult> {
    // 【修正】通过 this.context.request 使用宿主注入的 HTTP 实例
    // 这样自动带上了 Token，也不用自己处理 fetch
    try {
      // 假设 Stripe 需要先在后端创建 PaymentIntent
      const intent = await this.context.request('post', '/api/stripe/create-intent', {
        amount: params.amount,
        currency: params.currency,
      });

      // 【修正】调用 Stripe 官方的前端 SDK (这里假设已经通过 ScriptLoader 加载了)
      // 或者使用 InvokerFactory 拿到的执行器
      const { error, paymentIntent } = await (window as any).Stripe(this.config.key).confirmCardPayment(intent.client_secret);

      if (error) {
        // 使用标准错误类
        throw new PayError(PayErrorCode.PROVIDER_INTERNAL_ERROR, error.message, 'stripe');
      }

      return {
        status: 'success',
        transactionId: paymentIntent.id,
        raw: paymentIntent,
      };
    } catch (err) {
      // 抛出错误，会被 SDK 的 Plugin 捕获并处理
      throw err;
    }
  }

  // 3. 实现查单逻辑 (可选，如果 Stripe 前端直接返回结果，可能不需要轮询)
  async getPaySt(orderId: string): Promise<PayResult> {
    // 复用 HTTP 能力
    const res = await this.context.request('get', `/api/stripe/query?id=${orderId}`);
    return { status: res.status, raw: res };
  }
}
