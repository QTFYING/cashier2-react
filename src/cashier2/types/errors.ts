export enum PayErrorCode {
  // 1. 用户行为类 (业务层通常不需要弹红框报错，只需提示)
  USER_CANCEL = 'USER_CANCEL', // 用户主动取消/关闭窗口

  // 2. 环境/配置类 (通常是开发者的锅)
  INVALID_CONFIG = 'INVALID_CONFIG', // AppID 缺失、参数错误
  NOT_SUPPORTED = 'NOT_SUPPORTED', // 当前环境不支持此支付方式 (如在 PC 调起 JSAPI)
  SIGNATURE_FAILED = 'SIGNATURE_FAILED', // 验签失败

  // 3. 网络/运行时类 (需要引导用户重试)
  TIMEOUT = 'TIMEOUT', // 轮询超时或接口超时
  NETWORK_ERROR = 'NETWORK_ERROR', // 断网

  // 4. 渠道侧错误 (上游返回了明确的失败)
  PROVIDER_INTERNAL_ERROR = 'PROVIDER_INTERNAL_ERROR', // 微信/支付宝挂了

  // 5. 调起支付控件失败
  API_FAIL = 'API_FAIL', // 检查参数或环境

  // 6. 兜底
  UNKNOWN = 'UNKNOWN',

  PARAM_INVALID = 'PARAM_INVALID', // 参数无效
  GATEWAY_ERROR = 'GATEWAY_ERROR', // 预下单失败
}
