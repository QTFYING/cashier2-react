import { WechatAdapter } from '../adapters';
import { PaymentChannelEnum, type HttpClient, type PayParams, type PayResult } from '../types';
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

  public readonly name = PaymentChannelEnum.WE_CHAT;
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
   * 阶段1：准备支付
   */
  async prepare(params: PayParams, http: HttpClient): Promise<WechatResponse> {
    // 1. 校验 & 转换
    this.adapter.validate(params);
    const payload = this.adapter.transform(params);

    // mock数据重置
    this.startTime = Date.now();

    // 2. 后端签名
    return await http.post<WechatResponse>('/payment/wechat', payload);
  }

  /**
   * 阶段3：处理结果
   */
  process(rawResult: any): PayResult {
    return this.adapter.normalize(rawResult);
  }
}
