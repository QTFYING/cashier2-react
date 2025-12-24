// 导出核心类
export { PaymentContext } from './core/payment-context';

// 导出 Invoker 工厂,用户可自行注册Invoker，如·：uni.requestPayment
export { InvokerFactory } from './core/invoker-factory';

// 导出策略基类（方便用户自定义扩展）
export { PayError } from './core/payment-error';
export { BaseStrategy } from './strategies/base-strategy';
export { ScriptLoader } from './utils/script-loader';

// 导出内置策略
export { AlipayStrategy, WechatStrategy } from './strategies';

// 导出类型定义
export * from './types';
