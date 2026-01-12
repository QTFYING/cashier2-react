import type { PayResult } from '@my-cashier/core';

// 简单实现的 WebInvoker，用于处理 PC 端跳转/二维码
export class WebInvoker {
  async invoke(payload: any): Promise<PayResult> {
    console.log('[WebInvoker] Received payload:', payload);

    // 1. 处理 Alipay Form 表单提交
    if (payload?.form) {
      const div = document.createElement('div');
      div.innerHTML = payload.form;
      div.style.display = 'none';
      document.body.appendChild(div);
      const form = div.querySelector('form');
      if (form) {
        form.submit();
        // 提交后虽然页面跳转，但返回 pending 状态
        return {
          status: 'pending',
          raw: payload,
        } as any;
      }
    }

    // 2. 处理 URL 跳转 (支付宝/微信 H5)
    if (typeof payload === 'string' && (payload.startsWith('http') || payload.startsWith('weixin://'))) {
      window.location.href = payload;
      return { status: 'pending', raw: payload } as any;
    }

    // 3. 处理对象中的 URL (某些策略可能返回 { url: '...' })
    if (payload?.url) {
      window.location.href = payload.url;
      return { status: 'pending', raw: payload } as any;
    }

    // 4. 处理二维码 (微信 Native)
    if (payload?.codeUrl || payload?.qrCodeUrl) {
      return {
        status: 'pending',
        action: {
          type: 'qrcode',
          value: payload.codeUrl || payload.qrCodeUrl,
        },
        raw: payload,
      } as any;
    }

    // 5. 无法处理
    console.warn('[WebInvoker] Unknown payload format', payload);
    throw new Error('WebInvoker cannot handle this payload');
  }
}
