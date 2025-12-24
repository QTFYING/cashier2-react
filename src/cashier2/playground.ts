import { PaymentContext } from './core/payment-context';
import { AlipayStrategy, MockStrategy, WechatStrategy } from './strategies';
import { StripeStrategy } from './stripe-strategy';
import { PayErrorCode, PaymentChannelEnum, type PaymentPlugin } from './types';

async function main() {
  // 1. 初始化 Context (必须注入 HTTP 实例)
  const cashier = new PaymentContext({ debug: false, http: undefined, invokerType: 'uniapp' });

  cashier
    .register(new WechatStrategy({ appId: 'wx888888', mchId: '123456' }))
    .register(new AlipayStrategy({ appId: '2021000000', privateKey: '...' }))
    .register(new StripeStrategy({ appId: '2021000000', privateKey: '...' }))
    .register(new MockStrategy({}));

  // --- 3. 定义并注册插件 (Plugins) ---

  // 插件 A: 全局 Loading (对应原“环绕逻辑”)
  const LoadingPlugin: PaymentPlugin = {
    name: 'global-loading',
    onBeforePay() {
      console.log('>>> [Loading Plugin] 开启全局遮罩');
    },
    onCompleted() {
      // 无论成功失败，都在这里关闭，相当于 finally
      console.log('<<< [Loading Plugin] 关闭全局遮罩');
    },
  };

  // 插件 B: 权限校验 (对应原“阻断逻辑”)
  const AuthPlugin: PaymentPlugin = {
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

  // 插件 C: 日志上报 (对应原“结果读取逻辑”)
  const LoggerPlugin: PaymentPlugin = {
    name: 'logger',
    onBeforePay(ctx) {
      ctx.state.startTime = Date.now(); // 记录开始时间
      console.log('>>> [Logger Plugin] 计时开始');
    },
    onSuccess(ctx, res) {
      const duration = Date.now() - ctx.state.startTime;
      console.log(`✅ [Logger Plugin] 支付成功! 耗时: ${duration}ms`, res.transactionId);
      // Analytics.report('PAY_SUCCESS', ...)
    },
    onFail(_ctx, _error) {
      console.log(`❌ [Logger Plugin] 支付失败/取消`);
    },
  };

  // 注册所有插件
  cashier.use(LoadingPlugin).use(AuthPlugin).use(LoggerPlugin);

  // --- 4. 监听事件 (可选，用于 UI 组件通信) ---
  cashier.on('beforePay', (params) => {
    console.log('✨ [UI Event] 收到准备支付通知，金额:', params.amount);
  });

  // --- 5. 业务层调用 (Execution) ---
  try {
    console.log('\n------ 🚀 开始支付流程 ------\n');

    // 确定支付方式
    const result = await cashier.execute(PaymentChannelEnum.WE_CHAT, {
      orderId: 'ORDER_2025_001',
      amount: 100,
      description: 'Premium Subscription',
    });

    // 处理最终结果 (其实大部分逻辑已经被插件处理了，这里做最后跳转)
    if (result.status === 'success') {
      console.log('\n🎉 最终结果: 跳转成功页');
    } else if (result.status === 'pending') {
      console.log('\n⏳ 最终结果: 等待用户扫码...');

      // 模拟: 如果是扫码模式，手动开启轮询
      cashier.startPolling(PaymentChannelEnum.WE_CHAT, 'ORDER_2025_001');
    }
  } catch (err: any) {
    // 统一错误处理
    if (err.code === PayErrorCode.USER_CANCEL) {
      console.log('用户取消了');
    } else {
      console.error('业务层捕获异常:', err.message);
    }
  }
}

main();
