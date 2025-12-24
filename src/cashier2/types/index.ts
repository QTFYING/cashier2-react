// ==========================================  Level 1: Public Contract (核心类型)  ==========================================

// 1. 协议 (Params, Result, Actions)
export type { PaymentAction, PaymentChannel, PayParams, PayResult, PaySt } from './protocol';

// 2. 配置 (Config)
export type { SDKConfig } from './config';

// 3. 错误与枚举 (Errors)
// (注意：这里导出的是 Value 和 Enum，不是 Type)
export { ErrorCategory, PayErrorCode } from './errors';

// ==========================================  Level 2: Extension SPI (扩展协议)  ==========================================

// 4. 生命周期与插件 (Lifecycle)
// 包含 PaymentPlugin, PaymentContextState
export { type PaymentContextState, type PaymentPlugin } from './lifecycle';

// 5. 网络层 (HTTP)
// 用于自定义 HttpClient
export type { HttpClient, HttpResponse } from './http';

// 6. 全局枚举
export * from './enum';
