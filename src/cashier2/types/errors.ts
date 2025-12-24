export enum PayErrorCode {
  // --- 1. 用户交互类 (User Action) ---
  // 特点：通常不需要报错，UI 只需恢复按钮状态
  USER_CANCEL = 'USER_CANCEL', // 用户主动取消/关闭窗口

  // --- 2. 业务逻辑类 (Business Logic) ---
  // 特点：明确的失败原因，用户无法通过重试解决，需要更换支付方式或充值
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS', // 余额不足
  ORDER_CLOSED = 'ORDER_CLOSED', // 订单已关闭
  ORDER_EXPIRED = 'ORDER_EXPIRED', // 订单已过期
  RISK_CONTROL = 'RISK_CONTROL', // 触发风控拦截
  PARAM_INVALID = 'PARAM_INVALID', // 参数无效

  // --- 3. 网络与运行时类 (Network & Runtime) ---
  // 特点：临时性故障，建议引导用户重试
  TIMEOUT = 'TIMEOUT', // 轮询超时或接口超时
  NETWORK_ERROR = 'NETWORK_ERROR', // 断网/DNS失败
  GATEWAY_ERROR = 'GATEWAY_ERROR', // 网关错误 (502/504)

  // --- 4. 系统/配置类 (System & Config) ---
  // 特点：开发者的问题，通常需要修 Bug
  INVALID_CONFIG = 'INVALID_CONFIG', // AppID 缺失
  NOT_SUPPORTED = 'NOT_SUPPORTED', // 环境不支持
  SIGNATURE_FAILED = 'SIGNATURE_FAILED', // 验签失败
  INVOKE_FAILED = 'INVOKE_FAILED', // 调起支付控件失败 (如 JSBridge 没响应)

  // --- 5. 渠道内部错误 ---
  PROVIDER_INTERNAL_ERROR = 'PROVIDER_INTERNAL_ERROR', // 微信/支付宝挂了
  API_FAIL = 'API_FAIL', // 检查参数或环境

  // --- 6. 插件类报错 ---

  /**
   * 场景：插件主动要求停止流程（比如 Auth 插件发现没登录，跳转去登录页了，剩下的支付流程不需要跑了）
  // 处置：静默处理，不报错
   */
  PLUGIN_INTERRUPT = 'PLUGIN_INTERRUPT', // 插件中断流程

  /**
   * 场景：插件内部崩了（比如 Logger 插件写日志失败，或者参数校验插件发现参数不对）
   * 处置：视情况抛出 Fatal 或 Warning
   */
  PLUGIN_ERROR = 'PLUGIN_ERROR',

  // 7. 未知兜底
  UNKNOWN = 'UNKNOWN',
}

/**
 * [新增] 错误分类枚举
 * UI 层可以根据 Category 决定交互策略
 */
export enum ErrorCategory {
  SILENT = 'SILENT', // 静默处理 (如用户取消)
  RETRYABLE = 'RETRYABLE', // 可重试 (如网络波动)
  FATAL = 'FATAL', // 不可恢复 (如配置错误、余额不足)
  UNKNOWN = 'UNKNOWN',
}
