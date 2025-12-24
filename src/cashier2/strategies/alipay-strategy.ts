import { AlipayAdapter } from '../adapters';
import { InvokerFactory } from '../core/invoker-factory';
import type { HttpClient, PayParams, PayResult, SDKConfig } from '../types';
import { BaseStrategy } from './base-strategy';

type AlipayResponse =
  | string // 可能直接返回 form HTML 字符串
  | { orderStr: string } // App/小程序 字符串
  | { form: string } // 某些后端喜欢包一层 JSON
  | { qrCodeUrl: string }; // 扫码付

export class AlipayStrategy extends BaseStrategy<any> {
  private adapter = new AlipayAdapter();
  readonly name = 'alipay';

  // mock数据，后期删除
  private startTime = Date.now();

  /**
   * 实现单次查单逻辑
   * 真实逻辑: 调用后端查单API
   * Mock逻辑：在首次调用后的 10 秒内返回 pending，之后返回 success
   */
  async getPaySt(_orderId: string): Promise<PayResult> {
    // 模拟调用你的后端查单API
    // const resp = await axios.get(`/api/pay/query?id=${orderId}`);
    // return normalize(resp);

    // Mock逻辑：在首次调用后的 10 秒内返回 pending，之后返回 success

    const elapsed = Date.now() - this.startTime;

    if (elapsed < 10000) {
      return { status: 'pending', message: 'User is paying' };
    }

    console.log('有订单号了，支付宝支付成功啦～');

    return this.success(`MOCK`, { source: 'mock', elapsed });
  }

  /**
   * 实现单次支付逻辑
   * 真实逻辑: 调用后端统一下单API
   * Mock逻辑：模拟支付成功，返回订单号
   */
  async pay(params: PayParams, http: HttpClient, invokerType?: SDKConfig['invokerType']): Promise<PayResult> {
    // 1. 校验 (Adapter 负责，Strategy 不关心具体字段)
    this.adapter.validate(params);

    try {
      // 2. 转换 (Adapter 负责)
      const payload = this.adapter.transform(params);

      // 3. 后端签名 & 下单
      // 如果是 APP/小程序，后端返回 { orderStr: "..." }
      // 如果是 Wap/PC，后端返回 { form: "<form>..." } 或 { url: "..." }

      // 这里一定拿到的是data，不是这种格式的让客户端处理好返回（因为uni.request、fetch等返回的数据格式均不一样）
      const signedData = await http.post<AlipayResponse>('/payment/alipay', payload);

      // mock数据，每次执行的时候，重制一下开始时间
      this.startTime = Date.now();

      // 场景 B: 小程序 / APP (返回的是 SON或字符串类型的 orderStr)
      // 支付宝在 UniApp 里，orderInfo 就是这个字符串
      const orderStr = (signedData as { orderStr?: string }).orderStr || (typeof signedData === 'string' ? signedData : null);

      // 4. 执行 (Invoker 负责)
      const invoker = InvokerFactory.create(this.name, invokerType);

      const invokeRes = await invoker.invoke(orderStr);

      return this.adapter.normalize(invokeRes);
    } catch (error: any) {
      return {
        status: 'fail',
        message: error.message || 'Alipay Invoke Failed',
      };
    }
  }

  /**
   * 实现带轮询能力的支付
   * 真实逻辑: 调用后端查单API
   * Mock逻辑：在首次调用后的 10 秒内返回 pending，之后返回 success
   */

  async payWithPolling() {}
}
