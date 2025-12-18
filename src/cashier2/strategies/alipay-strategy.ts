import { AlipayAdapter } from '../adapters';
import { PayError } from '../core/payment-error';
import { PayErrorCode } from '../types/errors';
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

  // 实现单次查单逻辑
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

  async pay(params: PayParams): Promise<PayResult> {
    // ... 前置逻辑 ...

    try {
      // 假设这是调用支付宝后的原始返回
      const payload = this.adapter.transform(params);
      console.log('xxx-1', payload);
      // const rawRes = await this.invokeAlipay(payload);

      const _rawRes = await new Promise((resolve) => setTimeout(resolve, 500));

      // --- 关键点：错误码映射层 ---
      // return this.normalizeResult(rawRes);
      return this.success(`MOCK_ALIPAY_ORDER_ID_${params.orderId}`, { source: 'mock' });
    } catch (error: any) {
      // 如果是网络层抛出的 JS Error
      throw new PayError(PayErrorCode.UNKNOWN, error.message || 'Alipay invoke failed', this.name);
    }
  }

  /**
   * 专门负责“翻译”的方法
   */
  private normalizeResult(res: any): PayResult {
    // 支付宝返回码示例：
    // 9000: 成功
    // 6001: 用户取消
    // 4000: 系统异常
    // 6002: 网络异常

    const code = res.resultCode;

    switch (code) {
      case '9000':
        return {
          status: 'success',
          transactionId: res.tradeNo,
          raw: res,
        };

      case '8000': // 正在处理中
        return { status: 'pending', raw: res };

      case '6001':
        // [映射]：6001 -> USER_CANCEL
        throw new PayError(PayErrorCode.USER_CANCEL, '用户取消支付', this.name);

      case '6002':
        // [映射]：6002 -> NETWORK_ERROR
        throw new PayError(PayErrorCode.NETWORK_ERROR, '网络连接出错', this.name);

      case '4000':
      default:
        // [映射]：其他 -> PROVIDER_INTERNAL_ERROR
        throw new PayError(PayErrorCode.PROVIDER_INTERNAL_ERROR, `支付宝渠道异常: ${res.memo || code}`, this.name);
    }
  }
}
