export enum PaymentChannelEnum {
  WE_CHAT = 'wechat',
  ALI_PAY = 'alipay',
  STRIPE = 'stripe',
  CUSTOM = 'custom',
}

export enum PaymentInvokerEnum {
  WEB = 'web',
  UNI_APP = 'uni-app',
  WECHAT_MINI = 'wechat-mini',
  ALIPAY_MINI = 'alipay-mini',
}

export enum PayStEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAIL = 'fail',
  CANCEL = 'cancel',
}
