import { PaymentPlugin } from '@my-cashier/types';

/**
 * 模拟出错插件 (测试容错性)
 * 当critical指定为false时，插件出错不中断整个支付
 */
export const BadPlugin: PaymentPlugin = {
  name: 'bad-plugin',
  critical: false,
  onBeforePay() {
    console.log('>>> [Bad Plugin] 我要抛错了！');
    throw new Error('Oops, I crashed!');
  },
};
