import type { PaymentInvoker } from '../types';

declare const JSBridge: any;

/**
 * webview调用原生调起支付控件
 * 场景：原生壳 + H5 页面 (Hybrid 混合开发)
 * Bridge：JSBridge.call('nativePay', data)
 * 支付结束后，需要监听原生 APP 的回调（原生也会提供方法）
 * ✅ UniApp/RN 直接用，使用 UniAppInvoker / RNInvoker
 * ✅ Hybrid (H5) 调用bridge用，编写 BridgeInvoker，利用 JSBridge 通讯
 * ❌ 纯原生（Native）不能用：原生开发需自己对接微信或者支付宝 OpenSDK
 */

export class BridgeInvoker implements PaymentInvoker {
  async invoke(data: any) {
    return JSBridge.call('nativePay', data);
  }
}
