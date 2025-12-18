import type { PaymentInvoker, PayResult } from '../types';

/**
 * 表单跳转 Invoker
 * 负责处理支付宝返回的 HTML 表单字符串
 * 场景：PC/Wap 端支付跳转
 */
export class FormInvoker implements PaymentInvoker {
  async invoke(htmlForm: string): Promise<PayResult> {
    // 1. 检查环境 (必须是浏览器)
    if (typeof document === 'undefined') {
      throw new Error('FormInvoker only works in browser environment');
    }

    return new Promise(() => {
      // 2. 创建一个容器 div
      const div = document.createElement('div');
      // 隐藏它，不要影响 UI
      div.style.display = 'none';
      div.innerHTML = htmlForm;
      document.body.appendChild(div);

      // 3. 找到 form 元素并提交
      const form = div.getElementsByTagName('form')[0];
      if (form) {
        // 注意：submit 后页面会跳转，Promise 永远不会 resolve
        // 这是正常的，因为控制权交给支付宝页面了
        form.submit();

        // 只有一种情况需要处理：如果是在 SPA 中且新开窗口，这里可能需要做清理
        // 但通常支付是当前页跳转
      } else {
        throw new Error('Invalid Alipay Form HTML');
      }
    });
  }
}
