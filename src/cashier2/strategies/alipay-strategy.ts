import { AlipayAdapter } from '../adapters';
import type { HttpClient, PayParams, PayResult } from '../types';
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
   * 阶段1：准备支付
   */
  async prepare(params: PayParams, http: HttpClient): Promise<AlipayResponse> {
    // 1. 校验 & 转换
    this.adapter.validate(params);
    const payload = this.adapter.transform(params);

    // 2. 后端签名 & 下单
    // 如果是 APP/小程序，后端返回 { orderStr: "..." }
    // 如果是 Wap/PC，后端返回 { form: "<form>..." } 或 { url: "..." }
    const signedData = await http.post<AlipayResponse>('/payment/alipay', payload);

    // mock数据重置
    this.startTime = Date.now();

    return signedData;
  }

  /**
   * 阶段3：处理结果
   */
  process(rawResult: any): PayResult {
    // 支付宝在 UniApp 里，orderInfo 就是这个字符串
    // 这里需要处理一下 invoke 返回的差异，或者交给 Adapter
    return this.adapter.normalize(rawResult);
  }

  // async payWithPolling() {}
}
