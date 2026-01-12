import type { PaymentPlugin } from '@my-cashier/core';

export const AuthPlugin: PaymentPlugin = {
  name: 'auth-check',
  enforce: 'pre', // 强制最先执行
  async onBeforePay(ctx) {
    console.log('>>> [Auth Plugin] 检查登录状态...');
    const isLogin = true;

    if (!isLogin) {
      throw new Error('User not authorized'); // 抛错会直接中断流程
    }

    // 修改 Context: 自动带上 token
    console.log('>>> [Auth Plugin] 注入 Token');
    ctx.params.extra = { ...ctx.params.extra, token: 'xxxx-xxxx-xxxx' };
  },
  // 还可以顺便做个网络层拦截
  async onBeforeSign(_ctx) {
    console.log('>>> [Auth Plugin] 准备请求后端签名，Header已就绪');
  },
};
