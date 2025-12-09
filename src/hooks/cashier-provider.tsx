// src/hooks/react/CashierProvider.tsx
import React, { useEffect, useMemo } from 'react';
import { AlipayStrategy, PaymentContext, WechatStrategy, type SDKConfig } from '../cashier2';
import { MockStrategy } from '../cashier2/strategies';
import { CashierContext } from './cashier-context';

// 2. 定义 Provider 的 Props
// 我们提供两种模式：
// A. 懒人模式：传 config，Provider 帮你 new
// B. 高级模式：传 client，你在外面 new 好了传进来 (适合需要复杂配置或单例导出的场景)
interface CashierProviderProps {
  config?: SDKConfig;
  client?: PaymentContext;
  children: React.ReactNode;
}

/**
 * 核心组件：CashierProvider
 * 应该包裹在你的 App 最外层
 */
export const CashierProvider: React.FC<CashierProviderProps> = ({ config, client, children }) => {
  // 3. 实例化逻辑 (保证全局单例)
  // useMemo 确保只有在 config/client 变化时才重新创建，防止重复 new
  const cashierInstance = useMemo(() => {
    // 优先使用用户传入的现成实例
    if (client) return client;
    // 否则根据配置自动创建一个新实例
    if (config) return new PaymentContext(config);
    throw new Error('[CashierProvider] You must provide either "config" or "client" prop.');
  }, [config, client]);

  // 可选：组件卸载时清理资源 (如停止轮询)
  useEffect(() => {
    cashierInstance
      .register(new WechatStrategy({ appId: 'wx888888', mchId: '123456' }))
      .register(new AlipayStrategy({ appId: '2021000000', privateKey: '...' }))
      .register(new MockStrategy());

    return () => {
      // 如果 SDK 有 destroy 方法，可以在这里调用
      // cashierInstance.destroy();
      // 目前我们的架构里，至少应该停止可能存在的轮询
      cashierInstance.stopPolling();
    };
  }, [cashierInstance]);

  return <CashierContext.Provider value={{ cashier: cashierInstance }}>{children}</CashierContext.Provider>;
};
