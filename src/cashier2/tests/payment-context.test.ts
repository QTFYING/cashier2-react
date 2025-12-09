import { describe, expect, it } from 'vitest';
import { PaymentContext } from '../core/payment-context';
import { WechatStrategy } from '../strategies/wechat-strategy';
import type { PaymentPlugin } from '../types';

describe('PaymentContext', () => {
  it('should execute a strategy with mock mode', async () => {
    const context = new PaymentContext({ debug: true });
    const wechat = new WechatStrategy({ appId: 'test', mchId: 'test' }, { mock: true });

    context.register(wechat);

    const params = {
      orderId: 'TEST_001',
      amount: 100,
      description: 'Test Order',
    };

    const result = await context.execute('wechat', params);

    expect(result.status).toBe('pending'); // Mock returns pending for first 10s
    expect(result.message).toContain('Mock');
  });

  it('should run plugins in correct order', async () => {
    const context = new PaymentContext();
    const wechat = new WechatStrategy({ appId: 'test', mchId: 'test' }, { mock: true });
    context.register(wechat);

    const executionOrder: string[] = [];

    const plugin1: PaymentPlugin = {
      name: 'plugin1',
      onBeforePay: async () => {
        executionOrder.push('plugin1-before');
      },
      onFail: async () => {
        executionOrder.push('plugin1-fail');
      },
    };

    const plugin2: PaymentPlugin = {
      name: 'plugin2',
      enforce: 'pre',
      onBeforePay: async () => {
        executionOrder.push('plugin2-before');
      },
    };

    context.use(plugin1).use(plugin2);

    await context.execute('wechat', { orderId: '123', amount: 1 });

    // Plugin2 is 'pre', so it should run before plugin1
    expect(executionOrder[0]).toBe('plugin2-before');
    expect(executionOrder[1]).toBe('plugin1-before');
    // Mock returns pending, which currently falls into 'else' branch (fail) in PaymentContext
    expect(executionOrder[2]).toBe('plugin1-fail');
  });
});
