import { ScriptLoader } from '../../utils/script-loader';
import type { WebChannelHandler } from './types';

declare const _wx: any;

export class WechatWebHandler implements WebChannelHandler {
  async handle(data: any): Promise<any> {
    const ua = navigator.userAgent.toLowerCase();
    const isWechatEnv = ua.indexOf('micromessenger') !== -1;

    // 1. 非微信环境：H5 跳转 或 Native 扫码
    if (!isWechatEnv) {
      if (data.mweb_url) {
        window.location.href = data.mweb_url;
        return { action: 'url_jump', url: data.mweb_url };
      }
      if (data.code_url) {
        return { action: 'qrcode', code: data.code_url, original: data };
      }
      // 容错：有些时候后端可能没返回 mweb_url 但返回了 url
      if (data.url) {
        window.location.href = data.url;
        return { action: 'url_jump', url: data.url };
      }
    }

    // 2. 微信环境：JSAPI 调起
    if (isWechatEnv && data.paySign) {
      // 动态加载微信 JSSDK (如果项目中没有引入的话)
      await ScriptLoader.load('https://res.wx.qq.com/open/js/jweixin-1.6.0.js');
      return this.invokeBridge(data);
    }

    throw new Error('Invalid Wechat Payload for Web Environment');
  }

  private invokeBridge(data: any): Promise<any> {
    return new Promise((resolve) => {
      const onBridgeReady = () => {
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
}
