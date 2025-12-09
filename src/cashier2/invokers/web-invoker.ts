import { PayError } from '../core/payment-error';
import type { PayResult } from '../types';
import { PayErrorCode } from '../types/errors';
import type { PaymentInvoker } from '../types/invoker';
import { ScriptLoader } from '../utils/script-loader';

// 声明全局对象防止 TS 报错
declare const wx: any;
declare const _ap: any;

export class WebInvoker implements PaymentInvoker {
  constructor(private channel: string) {}

  /**
   * 核心执行方法
   * @param payload 经过 Strategy 处理后的标准化数据
   * 对于微信，可能是 { appId, timeStamp... }
   * 对于支付宝，可能是 HTML Form 字符串 或 URL
   * 对于 H5/PC，可能是 { url: '...' }
   */
  async invoke(payload: any): Promise<PayResult> {
    try {
      // 1. 针对微信渠道的处理
      if (this.channel === 'wechat') {
        return await this.handleWechat(payload);
      }

      // 2. 针对支付宝渠道的处理
      if (this.channel === 'alipay') {
        return await this.handleAlipay(payload);
      }

      // 3. 通用兜底：如果 payload 里有 url，直接跳转
      if (payload.url || payload.mweb_url) {
        window.location.href = payload.url || payload.mweb_url;
        // 跳转后，页面通常会卸载，返回 pending 即可
        return { status: 'pending', message: 'Redirecting...' };
      }

      throw new Error(`Unknown payload format for channel: ${this.channel}`);
    } catch (error: any) {
      throw new PayError(PayErrorCode.PROVIDER_INTERNAL_ERROR, error.message || 'WebInvoker Execution Failed', error);
    }
  }

  // ==========================================
  //  Private Handlers (不同渠道的脏活累活)
  // ==========================================

  /**
   * 处理微信支付逻辑
   * 区分：微信内(JSAPI) vs 微信外(H5/Native)
   */
  private async handleWechat(data: any): Promise<PayResult> {
    const isWechatBrowser = /MicroMessenger/i.test(navigator.userAgent);

    // 场景 A: 微信外部 (H5 / PC)
    // 后端通常返回 mweb_url (H5跳转) 或 code_url (PC扫码)
    if (!isWechatBrowser) {
      if (data.mweb_url) {
        // H5 支付：直接跳走
        window.location.href = data.mweb_url;
        return { status: 'pending', message: 'Redirecting to Wechat...' };
      }

      if (data.code_url) {
        // PC 扫码：不能跳走，要把二维码链接返回给 UI 展示
        return {
          status: 'pending',
          raw: data, // 把包含 code_url 的原始数据吐回去
          message: 'Waiting for scan',
        };
      }
    }

    // 场景 B: 微信内部 (JSAPI)
    // 需要加载 jweixin.js 并调用 chooseWXPay
    // 注意：这里复用了我们之前写的 ScriptLoader
    await ScriptLoader.load('https://res.wx.qq.com/open/js/jweixin-1.6.0.js');

    return new Promise((resolve, reject) => {
      if (typeof wx === 'undefined') {
        reject(new Error('Wechat JSSDK load failed'));
        return;
      }

      // 注意：标准流程是先 wx.config -> wx.ready -> wx.chooseWXPay
      // 但很多老项目使用 WeixinJSBridge (非官方但好用)，这里演示官方 JSSDK 流程
      wx.chooseWXPay({
        timestamp: data.timeStamp, // 注意大小写，微信很坑
        nonceStr: data.nonceStr,
        package: data.package,
        signType: data.signType,
        paySign: data.paySign,
        success: (res: any) => {
          // 微信返回 success 不代表一定到账，建议结合轮询
          resolve({ status: 'success', transactionId: res.transactionId, raw: res });
        },
        fail: (err: any) => {
          reject(new Error(err.errMsg || 'Wechat Pay Failed'));
        },
        cancel: () => {
          resolve({ status: 'cancel', message: 'User cancelled' });
        },
      });
    });
  }

  /**
   * 处理支付宝支付逻辑
   * 区分：支付宝内(JSAPI) vs 网页(Form/URL)
   */
  private async handleAlipay(data: any): Promise<PayResult> {
    const isAlipayBrowser = /AlipayClient/i.test(navigator.userAgent);

    // 场景 A: 支付宝内部 (JSAPI)
    if (isAlipayBrowser) {
      // 加载支付宝桥接库
      await ScriptLoader.load('https://gw.alipayobjects.com/as/g/h5-lib/alipayjsapi/3.1.1/alipayjsapi.min.js');

      return new Promise((resolve) => {
        // 逻辑同之前的 AlipayJSSDKStrategy，略...
        // ap.tradePay(...)
        resolve({ status: 'pending' });
      });
    }

    // 场景 B: 网页支付 (最常见的是 Form 表单提交)
    // 后端返回一段 <form action="...">...</form><script>submit()</script>
    if (typeof data === 'string' && data.includes('<form')) {
      const div = document.createElement('div');
      div.innerHTML = data; // 插入 HTML
      div.style.display = 'none';
      document.body.appendChild(div);

      // 找到 form 并提交
      const form = div.querySelector('form');
      if (form) {
        form.submit();
        // 提交后页面会跳转，返回 pending
        return { status: 'pending', message: 'Redirecting to Alipay...' };
      }
      throw new Error('Invalid Alipay Form Data');
    }

    // 场景 C: 支付宝 PC 扫码 (返回 URL)
    if (data.qrCodeUrl) {
      return { status: 'pending', raw: data };
    }

    // 场景 D: 普通跳转链接
    if (data.url) {
      window.location.href = data.url;
      return { status: 'pending' };
    }

    throw new Error('Unknown Alipay payload');
  }
}
