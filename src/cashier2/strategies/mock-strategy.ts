import type { SDKConfig } from '../core/payment-context';
import type { HttpClient, PayParams, PayResult } from '../types';
import { BaseStrategy } from './base-strategy'; // 假设路径

// 定义 Mock 特有的配置接口
export interface MockStrategyConfig {
  latency?: number; // 模拟网络延时
  scenario?: 'success' | 'fail' | 'timeout' | 'cancel'; // 模拟场景
  mockTransactionId?: string; // 指定返回的流水号
}

/**
 * Mock 策略
 * 继承 BaseStrategy 以复用 success/fail/validateParams 能力
 */
export class MockStrategy extends BaseStrategy<MockStrategyConfig> {
  // 必须实现抽象属性 name
  public readonly name = 'mock';

  constructor(config: MockStrategyConfig = {}) {
    // 这里的第二个参数是通用 StrategyOptions，根据需要传
    super({ latency: 1000, scenario: 'success', ...config }, {});
  }

  /**
   * 实现核心支付逻辑
   */
  async pay(params: PayParams, _http: HttpClient, invokerType: SDKConfig['invokerType']): Promise<PayResult> {
    console.log(`\n[Mock Strategy] 开始执行支付...`);
    console.log(`- 场景: ${this.config.scenario}`);
    console.log(`- 环境: ${invokerType}`);
    console.log(`- 参数:`, params);

    // 1. 复用父类的参数校验 (如果父类逻辑不够，也可以在这里重写)
    this.validateParams(params);

    // 2. 模拟网络延时
    await new Promise((resolve) => setTimeout(resolve, this.config.latency));

    // 3. 根据配置分发结果
    // 注意：这里就可以直接使用父类的 protected 方法了
    switch (this.config.scenario) {
      case 'success':
        return this.success(this.config.mockTransactionId || `MOCK_${Date.now()}`, { mockData: 'ok' });

      case 'fail':
        return this.fail('模拟支付失败：余额不足', { code: 'ERR_BALANCE' });

      case 'timeout':
        // 模拟抛错，通常由 SDK 外部捕获或由 BaseStrategy 处理
        throw new Error('TIMEOUT');

      case 'cancel':
        return this.fail('用户取消支付', { code: 'USER_CANCEL' });

      default:
        return this.fail('未知的模拟场景');
    }
  }

  /**
   * 实现查单逻辑
   */
  async getPaySt(orderId: string): Promise<PayResult> {
    console.log(`[Mock Strategy] 查询订单状态: ${orderId}`);

    // 简单模拟：如果策略配置是 success，查单也返回 success
    if (this.config.scenario === 'success') {
      return this.success(`MOCK_TRX_${orderId}`, { status: 'paid' });
    } else {
      return this.fail('订单未支付或不存在');
    }
  }
}
