import { WebInvoker } from '../invokers';
import { AlipayMiniInvoker } from '../invokers/alipay-mini-invoker';
import { FormInvoker } from '../invokers/form-invoker';
import { UniAppInvoker } from '../invokers/uni-invoker';
import { WechatMiniInvoker } from '../invokers/wechat-mini-invoker';
import type { PaymentInvoker } from '../types';

// 全局变量声明
declare const uni: any;
declare const wx: any;
declare const my: any;

export type InvokerType = 'uniapp' | 'web' | 'wechat-mini' | 'alipay-mini' | 'baidu-mini' | 'form' | '';
export type PayPlatformType = 'wechat' | 'alipay' | 'unionpay' | 'other';

export class InvokerFactory {
  /**
   * 自动感知环境，返回最合适的执行器
   * @param channel
   * @param type
   */
  static create(channel: PayPlatformType, type?: InvokerType): PaymentInvoker {
    // --- 1. 显式指定模式 (Explicit) ---
    if (type === 'uniapp') return new UniAppInvoker(channel);
    if (type === 'wechat-mini') return new WechatMiniInvoker(channel);
    if (type === 'alipay-mini') return new AlipayMiniInvoker(channel);
    if (type === 'form') return new FormInvoker();

    // --- 2. 自动探测模式 (Auto Detect) ---
    // Type 1: UniApp (跨端框架)
    if (typeof uni !== 'undefined' && uni.requestPayment) {
      return new UniAppInvoker(channel);
    }

    // Type 2: 支付宝小程序 (特征明显: my)
    if (typeof my !== 'undefined' && my.tradePay) {
      return new AlipayMiniInvoker(channel);
    }

    // Type 3: 微信小程序 (最后判断，因为 wx 最容易被 polyfill)
    if (typeof wx !== 'undefined' && wx.requestPayment) {
      return new WechatMiniInvoker(channel);
    }

    // Web 兜底
    return new WebInvoker(channel);
  }
}
