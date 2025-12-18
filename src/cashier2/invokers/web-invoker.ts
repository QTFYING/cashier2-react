import { PayPlatformType } from '../core/invoker-factory';
import { PayError } from '../core/payment-error';
import { PayErrorCode, PaymentInvoker, PayResult } from '../types';
import { ScriptLoader } from '../utils/script-loader';

// 全局声明
declare const wx: any;
declare const _ap: any;
declare const AlipayJSBridge: any;

export class WebInvoker implements PaymentInvoker {
  constructor(private channel: PayPlatformType = 'other') {}

  async invoke(payload: any): Promise<PayResult> {
    try {
      // 1. 微信环境处理 (JSAPI / H5 / Native)
      if (this.channel === 'wechat') {
        return await this.handleWechat(payload);
      }

      // 2. 支付宝环境处理 (JSAPI / URL)
      // 注意：Form 表单逻辑已经被剥离，这里只处理支付宝内的 JSAPI 或 URL 跳转
      if (this.channel === 'alipay') {
        return await this.handleAlipay(payload);
      }

      // 3. 通用 HTTP 跳转兜底
      if (payload.url || payload.mweb_url) {
        window.location.href = payload.url || payload.mweb_url;
        // 跳转后，页面通常会卸载，返回 pending 即可
        return { status: 'pending', message: 'Redirecting...' };
      }

      throw new Error(`[WebInvoker] Unsupported payload for channel: ${this.channel}`);
    } catch (error: any) {
      // 包装错误，保持对外统一
      throw new PayError(PayErrorCode.INVOKE_FAILED, error.message || 'Web Invoke Failed', error);
    }
  }

  // ==========================================
  //  微信专用逻辑
  // ==========================================
  private async handleWechat(data: any): Promise<PayResult> {
    const ua = navigator.userAgent.toLowerCase();
    const isWechatEnv = ua.indexOf('micromessenger') !== -1;

    // A. 微信外部 (H5跳转 或 PC扫码)
    if (!isWechatEnv) {
      // H5 链接跳转
      if (data.mweb_url) {
        window.location.href = data.mweb_url;
        return { status: 'pending', message: 'Redirecting to Wechat H5...' };
      }
      // Native 扫码链接 (不跳转，直接返回给 UI 渲染二维码)
      if (data.code_url) {
        return {
          status: 'pending',
          actionType: 'qrcode', // 标记给 Adapter/UI 识别
          raw: data,
          message: 'Please scan the QR code',
        };
      }
    }

    // B. 微信内部 (JSAPI)
    // 只有在微信里，且 payload 是签名包时，才加载 SDK
    if (isWechatEnv && data.paySign) {
      await ScriptLoader.load('https://res.wx.qq.com/open/js/jweixin-1.6.0.js');
      return this.callWechatBridge(data);
    }

    throw new Error('Invalid Wechat Payload for Web Environment');
  }

  private callWechatBridge(data: any): Promise<PayResult> {
    return new Promise((resolve, reject) => {
      const onBridgeReady = () => {
        // 使用 WeixinJSBridge (非官方文档但极其稳定，无需 config)
        // 如果需要 wx.chooseWXPay，则需要后端配合换取 ticket 做 config，流程太重
        // appId, timeStamp, nonceStr, package, signType, paySign  6大核心参数，后台必须按照微信格式传递，SDK不做处理
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

  // ==========================================
  //  支付宝专用逻辑
  // ==========================================
  private async handleAlipay(data: any): Promise<PayResult> {
    const ua = navigator.userAgent.toLowerCase();
    const isAlipayEnv = ua.indexOf('alipayclient') !== -1;

    // A. 支付宝内部 (JSAPI)
    // 只有 tradeNO 且在支付宝环境才走 JSAPI
    if (isAlipayEnv && (data.tradeNO || data.trade_no)) {
      await ScriptLoader.load('https://gw.alipayobjects.com/as/g/h5-lib/alipayjsapi/3.1.1/alipayjsapi.min.js');
      return this.callAlipayBridge(data.tradeNO || data.trade_no);
    }

    // B. 外部 H5 跳转 (Wap 支付返回 URL 的情况)
    if (data.url) {
      window.location.href = data.url;
      return { status: 'pending', message: 'Redirecting to Alipay...' };
    }

    // C. PC 扫码
    if (data.qrCodeUrl || data.qr_code) {
      return {
        status: 'pending',
        actionType: 'qrcode',
        raw: data,
      };
    }

    throw new Error('For Alipay HTML Form, please use FormInvoker instead.');
  }

  private callAlipayBridge(tradeNO: string): Promise<PayResult> {
    return new Promise((resolve, reject) => {
      const invoke = () => {
        _ap.tradePay({ tradeNO: tradeNO }, (res: any) => {
          // 支付宝 JSAPI 回调代码转换
          // 9000 成功, 6001 取消...
          // 这里直接返回 raw，交给 Adapter.normalize 去洗
          resolve({ status: 'success', raw: res });
        });
      };

      if ((window as any).AlipayJSBridge) {
        invoke();
      } else {
        document.addEventListener('AlipayJSBridgeReady', invoke, false);
      }
    });
  }
}
