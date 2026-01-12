// src/hooks/react/CashierProvider.tsx
import { AlipayStrategy, PaymentContext, WechatStrategy, type SDKConfig } from '@my-cashier/core';
// import { MockStrategy } from '@my-cashier/types';
import React, { useEffect, useMemo } from 'react';
import { CashierContext } from './cashier-context';
import './invoker'; // 注入TikTok执行器
import { AuthPlugin, LoadingPlugin, LoggerPlugin } from './plugin';

// 2. 定义 Provider 的 Props
// 提供两种模式：
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
  const cashier = useMemo(() => {
    // 优先使用用户传入的现成实例
    if (client) return client;
    // 否则根据配置自动创建一个新实例
    if (config) return new PaymentContext(config);
    throw new Error('[CashierProvider] You must provide either "config" or "client" prop.');
  }, [config, client]);

  useEffect(() => {
    // 1. 注册默认策略
    cashier.register(new WechatStrategy({ appId: 'wx888888', mchId: '123456' })).register(new AlipayStrategy({ appId: '2021000000', privateKey: '...' }));
    // .register(new MockStrategy());

    // 2. 注册默认插件 (全局副作用，确保只注册一次, 这个一定不能放在 Hooks 内)
    // 在 Hook 中注册会导致每次组件挂载都重复添加插件（如重复的 Logger 或 Loading），造成性能浪费和潜在 Bug
    // 注意：PaymentContext.use 没有去重逻辑，但在 React 18 Strict Mode 下 useEffect 会执行两次
    cashier.use(LoggerPlugin).use(LoadingPlugin).use(AuthPlugin);

    return () => {
      cashier.destroy();
    };
  }, [cashier]);

  return <CashierContext.Provider value={{ cashier }}>{children}</CashierContext.Provider>;
};
