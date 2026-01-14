export class StripeInvoker {
  async invoke(payload: any) {
    // 调用 Stripe 官方的前端 SDK
    console.log('[StripeInvoker] Intecepted via custom launcher');
    const { error, paymentIntent } = await (window as any).Stripe('pk_test_xxx').confirmCardPayment(payload.client_secret);

    if (error) throw new Error(error.message);
    return paymentIntent;
  }
}
