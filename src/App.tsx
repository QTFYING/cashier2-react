import { AlipayStrategy, PaymentContext, WechatStrategy } from '@my-cashier/core';
import { CashierProvider } from '@my-cashier/react';
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import service from './api/request';
import router from './router';

const App: React.FC = () => {
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

  const client = React.useMemo(() => {
    const cashier = new PaymentContext({ debug: true, http: httpInstance, invokerType: 'web' });

    // Register Strategies
    cashier.register(new WechatStrategy({ appId: 'wx888888', mchId: '123456' }));
    cashier.register(new AlipayStrategy({ appId: '2021000000', privateKey: '...' }));

    return cashier;
  }, []);

  return (
    <CashierProvider client={client} config={{ debug: true, http: httpInstance, invokerType: 'web' }}>
      <RouterProvider router={router} />
    </CashierProvider>
  );
};

export default App;
