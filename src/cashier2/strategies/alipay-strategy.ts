import { AlipayAdapter } from '../adapters';
import { InvokerFactory } from '../core/invoker-factory';
import type { SDKConfig } from '../core/payment-context';
import { FormInvoker } from '../invokers/form-invoker';
import type { HttpClient } from '../types';
import type { PayParams, PayResult } from '../types/protocol';
import { BaseStrategy } from './base-strategy';

// 定义微信策略需要的配置类型
interface AlipayConfig {
  appId: string;
  privateKey: string;
  notifyUrl?: string;
}

export class AlipayStrategy extends BaseStrategy<AlipayConfig> {
  private adapter = new AlipayAdapter();
  readonly name = 'alipay';
  private startTime = Date.now();

  /**
   * 实现单次查单逻辑
   * 真实逻辑: 调用后端查单API
   * Mock逻辑：在首次调用后的 10 秒内返回 pending，之后返回 success
   */
  async getPaySt(_orderId: string): Promise<PayResult> {
    // 模拟调用你的后端查单API
    // const res = await axios.get(`/api/pay/query?id=${orderId}`);
    // return normalize(res);

    // Mock逻辑：在首次调用后的 10 秒内返回 pending，之后返回 success

    const elapsed = Date.now() - this.startTime;

    if (elapsed < 10000) {
      return { status: 'pending', message: 'User is paying' };
    }

    console.log('有订单号了，支付宝支付成功啦～');

    return this.success(`MOCK_11111`, { source: 'mock', elapsed });
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

      const { data: res } = await http.post('/payment/alipay', payload);

      let rawResult;

      // 4. 执行 (Invoker 负责)
      // 场景 A: 表单跳转 (PC / Wap)
      if (typeof res === 'string' && res.includes('<form')) {
        const formInvoker = new FormInvoker();
        // 这是一个“去而不返”的操作
        return formInvoker.invoke(res);
      }

      // 场景 B: 小程序 / APP (返回的是 JSON 或 字符串类型的 orderStr)
      // 支付宝在 UniApp 里，orderInfo 就是这个字符串
      if (res.orderStr || (typeof res === 'string' && !res.includes('<'))) {
        debugger;
        const orderInfo = res.orderStr || res;
        const invoker = InvokerFactory.create(this.name, invokerType);
        rawResult = await invoker.invoke(orderInfo);
      }

      debugger;
      return this.adapter.normalize(rawResult);
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
