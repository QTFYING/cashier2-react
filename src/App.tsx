import { AlipayStrategy, PaymentContext, WebInvoker, WechatStrategy } from '@my-cashier/core';
import { CashierProvider } from '@my-cashier/react';
import { RouterProvider } from 'react-router-dom';
import service from './api/request';
import { StripeStrategy } from './payment/channels/stripe';
import { AuthPlugin, BadPlugin, LoadingPlugin, LoggerPlugin } from './payment/plugins';
import router from './router';

const App = () => {
  /**
   * 核心适配器：将客户端的 service 包装成 SDK 预期的“纯净版” HttpClient
   */
  const httpInstance = {
    post: async <T = any,>(url: string, data?: any): Promise<T> => {
      // 1. 调用原始 service
      // 这里的 res 可能是 { code: 200, data: { orderStr: '...' } }
      // 也可能是 { orderStr: '...' } 直接返回
      const res = await service.post<any, any>(url, data);

      // 2. 自动脱壳逻辑
      // 如果发现有 code 和 data 字段，说明是包装形态，只返回内部的 data
      if (res && typeof res === 'object' && 'code' in res && 'data' in res) {
        return res.data as T;
      }

      // 3. 否则，说明已经是纯净数据或特殊结构，原样返回
      return res as T;
    },

    // 同理处理 get (如果 SDK 内部用到)
    get: async <T = any,>(url: string, params?: any): Promise<T> => {
      const res = await service.get<any, any>(url, { params });
      return res && 'code' in res && 'data' in res ? res.data : res;
    },
  };

  /**
   * 注入执行器
   * 如果使用自己注入的启动器，则在初始化时，invokerType写成自定义的name即可
   */

  // InvokerFactory.register('stripe', StripeInvoker, () => true, 99);

  const cashier = new PaymentContext({ debug: true, http: httpInstance, invokerType: 'web' });

  // 注册支付方式
  cashier
    .register(new WechatStrategy({ appId: 'wx888888', mchId: '123456' }))
    .register(new AlipayStrategy({ appId: '2021000000', privateKey: '...' }))
    .register(new StripeStrategy({ appId: '2021000000', privateKey: '...' })); // 自定义支付方式，并采用

  // 注册插件
  cashier.use(LoadingPlugin).use(AuthPlugin).use(LoggerPlugin).use(BadPlugin);

  // 注册Invoker
  cashier.injectInvoker('web', WebInvoker);

  return (
    <CashierProvider client={cashier}>
      <RouterProvider router={router} />
    </CashierProvider>
  );
};

export default App;
