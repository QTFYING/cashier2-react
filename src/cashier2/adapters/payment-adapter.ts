import type { PayParams, PayResult } from '../types';

/**
 * 支付适配器
 * TRequest = 渠道专用请求参数类型 (如 WechatPayload)
 * TRawResponse = 支付结果 (如 WechatRawResponse)
 */
export interface PaymentAdapter<TRequest = any, TRawResponse = any> {
  /**
   * 1. [前置校验]
   * 检查参数是否满足当前渠道的最小要求
   * 如果不满足，直接抛出 adapter-validation-error，避免发起无用的网络请求
   */
  validate(params: PayParams): void;

  /**
   * 2. [请求转换] (去程)
   * 将统一参数转化为渠道专用参数
   * @param params 业务参数
   * @param config 额外的配置上下文 (如 appId, mchId)，可选
   */
  transform(params: PayParams, config?: any): TRequest;

  /**
   * 3.专门用来清洗 Invoker 返回的脏数据
   * 将其统一成 SDK 标准的 PaymentResult
   * 微信小程序：成功是 { errMsg: "requestPayment:ok" }。
   * 微信 H5/JSSDK：成功是 { errMsg: "chooseWXPay:ok" }。
   * 支付宝小程序：成功是 { resultCode: "9000" }（注意是字符串）。
   * 支付宝 H5：可能是 URL 跳转，也可能是 form 提交后页面刷新（无直接返回值）。
   */
  normalize(rawResult: TRawResponse): PayResult;
}
