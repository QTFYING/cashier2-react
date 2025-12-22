import type { PayPlatformType } from '../core/invoker-factory';
import { PayError } from '../core/payment-error';
import { PayErrorCode, type PaymentInvoker } from '../types';
import { ScriptLoader } from '../utils/script-loader';

// 全局声明
declare const _wx: any;
declare const ap: any;

export class WebInvoker implements PaymentInvoker {
  constructor(private channel: PayPlatformType = 'other') {}

  // 注意：这里返回值改成了 Promise<any>
  // 我们不再返回 PayResult，而是返回“原生数据”或“动作描述”，交给 Adapter 去 normalize
  async invoke(payload: any): Promise<any> {
    try {
      // 1. 微信处理 (JSAPI / H5 / Native)
      if (this.channel === 'wechat') {
        return await this.handleWechat(payload);
      }

      // 2. 支付宝处理 (JSAPI / URL)，不处理Form表单
      if (this.channel === 'alipay') {
        return await this.handleAlipay(payload);
      }

      // 3. 通用 HTTP 跳转兜底
      // 这是一个动作，Invoker 只要如实上报“我跳了”这件事
      if (payload.url || payload.mweb_url) {
        const target_url = payload.url || payload.mweb_url;
        window.location.href = target_url;

        return { action: 'url_jump', url: target_url };
      }

      throw new Error(`[WebInvoker] Unsupported payload for channel: ${this.channel}`);
    } catch (error: any) {
      // Invoker 只负责抛出执行层的异常（如脚本加载失败、浏览器环境不支持等）
      throw new PayError(PayErrorCode.INVOKE_FAILED, error.message || 'Web Invoke Failed', error);
    }
  }

  /* ========================================== 微信专用逻辑 ==========================================*/

  private async handleWechat(data: any): Promise<any> {
    const ua = navigator.userAgent.toLowerCase();
    const isWechatEnv = ua.indexOf('micromessenger') !== -1;

    if (!isWechatEnv) {
      // H5 跳转
      if (data.mweb_url) {
        window.location.href = data.mweb_url;
        return { action: 'url_jump', url: data.mweb_url };
      }
      // Native 扫码
      if (data.code_url) {
        return { action: 'qrcode', code: data.code_url, original: data };
      }
    }

    if (isWechatEnv && data.paySign) {
      await ScriptLoader.load('https://res.wx.qq.com/open/js/jweixin-1.6.0.js');
      return this.invokerWechatPay(data);
    }

    throw new Error('Invalid Wechat Payload for Web Environment');
  }

  /* ========================================== 支付宝专用逻辑 ==========================================*/

  private async handleAlipay(data: any): Promise<any> {
    const ua = navigator.userAgent.toLowerCase();
    const isAlipayEnv = ua.indexOf('alipayclient') !== -1;

    // JSAPI，只有 tradeNO 且在支付宝环境才走 JSAPI
    if (isAlipayEnv && (data.tradeNO || data.trade_no)) {
      await ScriptLoader.load('https://gw.alipayobjects.com/as/g/h5-lib/alipayjsapi/3.1.1/alipayjsapi.min.js');
      return this.invokerAlipay(data.tradeNO || data.trade_no);
    }

    // HTML Form 表单 跳转 (通常是支付宝 PC/Wap)
    if (typeof data === 'string' && data.includes('<form')) {
      return this.onFormSubmit(data);
    }

    // H5 跳转
    if (data.url) {
      window.location.href = data.url;
      return { action: 'url_jump', url: data.url };
    }

    // PC 扫码
    if (data.qrCodeUrl || data.qr_code) {
      return { action: 'qrcode', code: data.qrCodeUrl || data.qr_code, original: data };
    }

    throw new Error('For Alipay HTML Form, please use FormInvoker instead.');
  }

  // 微信小程序支付
  private invokerWechatPay(data: any): Promise<any> {
    return new Promise((resolve) => {
      const onBridgeReady = () => {
        // [纯净版] 不做任何判断，直接透传微信给的 res
        // 哪怕 res.err_msg 是 fail，也原样扔给 Adapter
        (window as any).WeixinJSBridge.invoke('getBrandWCPayRequest', data, (res: any) => resolve(res));
      };

      if (typeof (window as any).WeixinJSBridge == 'undefined') {
        if (document.addEventListener) {
          document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
        }
      } else {
        onBridgeReady();
      }
    });
  }

  // 支付宝小程序支付
  private invokerAlipay(tradeNO: string): Promise<any> {
    return new Promise((resolve) => {
      const invoke = () => {
        ap.tradePay({ tradeNO: tradeNO }, (res: any) => {
          // 直接透传支付宝给的原始对象 (包含 resultCode 等)
          resolve(res);
        });
      };

      if ((window as any).AlipayJSBridge) {
        invoke();
      } else {
        document.addEventListener('AlipayJSBridgeReady', invoke, false);
      }
    });
  }

  // 支付宝表单支付
  private onFormSubmit(html: string): Promise<void> {
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div);
    const form = div.querySelector('form');
    if (form) {
      form.submit();
    }
    return Promise.resolve();
  }
}
