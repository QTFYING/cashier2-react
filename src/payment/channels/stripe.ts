import { BaseStrategy, PayParams, PayResult } from '@my-cashier/core';

export class StripeStrategy extends BaseStrategy {
  readonly name = 'stripe';

  async prepare(params: PayParams): Promise<any> {
    const intent = await this.context.request('post', '/api/stripe/create-intent', {
      amount: params.amount,
      currency: params.currency,
    });
    return intent;
  }

  process(rawResult: any): PayResult {
    return {
      status: 'success',
      transactionId: rawResult.id,
      raw: rawResult,
    };
  }

  async getPaySt(orderId: string): Promise<PayResult> {
    const res = await this.context.request('get', `/api/stripe/query?id=${orderId}`);
    return { status: res.status, raw: res };
  }
}
