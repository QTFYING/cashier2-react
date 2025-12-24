import { ScriptLoader } from '../../utils/script-loader';
import type { WebChannelHandler } from './types';

declare const ap: any;

export class AlipayWebHandler implements WebChannelHandler {
  async handle(data: any): Promise<any> {
    const ua = navigator.userAgent.toLowerCase();
    const isAlipayEnv = ua.indexOf('alipayclient') !== -1;

    // 1. 支付宝环境内：JSAPI
    if (isAlipayEnv && (data.tradeNO || data.trade_no)) {
      await ScriptLoader.load('https://gw.alipayobjects.com/as/g/h5-lib/alipayjsapi/3.1.1/alipayjsapi.min.js');
      return this.invokeBridge(data.tradeNO || data.trade_no);
    }

    // 2. HTML Form 表单 (PC/Wap 常用)
    if (typeof data === 'string' && data.includes('<form')) {
      return this.submitForm(data);
    }

    // 3. H5 跳转
    if (data.url) {
      window.location.href = data.url;
      return { action: 'url_jump', url: data.url };
    }

    // 4. PC 扫码
    if (data.qrCodeUrl || data.qr_code) {
      return { action: 'qrcode', code: data.qrCodeUrl || data.qr_code, original: data };
    }

    throw new Error('Unsupported Alipay Payload');
  }

  private invokeBridge(tradeNO: string): Promise<any> {
    return new Promise((resolve) => {
      const invoke = () => {
        ap.tradePay({ tradeNO: tradeNO }, (res: any) => resolve(res));
      };
      if ((window as any).AlipayJSBridge) {
        invoke();
      } else {
        document.addEventListener('AlipayJSBridgeReady', invoke, false);
      }
    });
  }

  private submitForm(html: string): Promise<void> {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.style.display = 'none'; // 隐藏 DOM 防止闪烁
    document.body.appendChild(div);
    const form = div.querySelector('form');
    if (form) {
      form.submit();
    }
    return Promise.resolve();
  }
}
