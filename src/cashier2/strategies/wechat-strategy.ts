import { WechatAdapter } from '../adapters';
import { InvokerFactory } from '../core/invoker-factory';
import type { SDKConfig } from '../core/payment-context';
import type { HttpClient, PayParams, PayResult } from '../types';
import { Poller } from '../utils/poller';
import { BaseStrategy } from './base-strategy';

// 定义微信策略需要的配置类型
interface WechatConfig {
  appId: string;
  mchId: string;
  notifyUrl?: string;
}

type WechatResponse =
  | { appId: string; timeStamp: string; nonceStr: string; package: string; signType: string; paySign: string } // // JSAPI 支付 / 小程序支付
  | { mwebUrl: string } // H5 支付
  | { codeUrl: string }; // Native 扫码支付

export class WechatStrategy extends BaseStrategy<WechatConfig> {
  private adapter = new WechatAdapter();

  public readonly name = 'wechat';
  private startTime = Date.now();

  /**
   * 实现单次查单逻辑
   * 真实逻辑: 调用后端查单API
   * Mock逻辑：在首次调用后的 10 秒内返回 pending，之后返回 success
   */
  async getPaySt(_orderId: string): Promise<PayResult> {
    // 真实逻辑: 调用后端查单API
    // const res = await this.http.get(`/api/pay/query?id=${orderId}`);
    // return normalize(res);
    // Mock逻辑：在首次调用后的 10 秒内返回 pending，之后返回 success

    const elapsed = Date.now() - this.startTime;

    if (elapsed < 10000) {
      return { status: 'pending', message: 'User is paying2' };
    }

    console.log('有订单号了，微信支付成功啦～');

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
      // 向后端请求支付参数，后期计划这个API也可配置
      // 服务端做了两件事情，一是统一下单拿到prepay_id，二是返回签名后的参数
      // 签名所需要：appId, timestamp, nonceStr, packageStr, 'MD5', API_KEY

      // 2. 转换 (Adapter 负责，Strategy 不关心元转分)
      const payload = this.adapter.transform(params);

      // 3. 后端签名 & 下单
      // 返回的参数，可以直接透传给Invoker（主要是5大金刚）
      const signedData = await http.post<WechatResponse>('/payment/wechat', payload);

      // 4. 执行 (Invoker 负责)
      const invoker = InvokerFactory.create(this.name, invokerType);

      const invokeRes = await invoker.invoke(signedData);

      return this.adapter.normalize(invokeRes);
    } catch (error: any) {
      return {
        status: 'fail',
        message: error.message || 'Wechat Invoke Failed',
      };
    }
  }

  /**
   * 实现带轮询能力的支付
   * 真实逻辑: 调用后端查单API
   * Mock逻辑：在首次调用后的 10 秒内返回 pending，之后返回 success
   */
  async payWithPolling(params: PayParams, http: HttpClient, invokerType?: SDKConfig['invokerType']): Promise<PayResult> {
    // 1. 先获取二维码链接
    const prepareResult = await this.pay(params, http, invokerType);

    // 如果不是 pending (比如直接失败了)，直接返回
    if (prepareResult.status !== 'pending') {
      return prepareResult;
    }

    console.log('二维码已获取，开始轮询查单...');

    // 2. 初始化轮询器 (指数退避，最长查 2 分钟)
    const poller = new Poller({ strategy: 'exponential', timeout: 120 * 1000 });

    try {
      // 3. 启动轮询
      const finalResult = await poller.start(
        // Task: 每次查单动作
        () => this.getPaySt(params.orderId),

        // Validator: 什么时候停止？(成功或失败时停止，pending 继续查)
        (res) => res.status === 'success' || res.status === 'fail',
      );

      return finalResult;
    } catch (err: any) {
      // 超时或被手动停止
      return { status: 'fail', message: err.message || 'Polling timeout or cancelled' };
    }
  }
}
