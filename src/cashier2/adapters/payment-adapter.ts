// src/adapters/payment-adapter.ts
import { PayParams } from '../types';

/**
 * 支付参数适配器接口
 * T = 目标平台需要的参数类型
 */
export interface PaymentAdapter<T = any> {
  /**
   * 将统一参数转化为渠道专用参数
   */
  transform(params: PayParams): T;
}