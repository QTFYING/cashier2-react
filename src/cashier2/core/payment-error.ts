// src/core/PayError.ts
import { PayErrorCode } from '../types';

export class PayError extends Error {
  public readonly transactionId: string;
  public readonly status: string;
  public readonly raw?: any; // 保留原始报错对象，方便 Sentry 上报

  constructor(code: PayErrorCode, message: string, raw?: any) {
    super(message);
    this.status = code;
    this.transactionId = 'PayError';
    this.message = message;
    this.raw = raw;

    // 修复 TypeScript 继承 Error 时的原型链断裂问题 (ES5 target 下常见)
    Object.setPrototypeOf(this, PayError.prototype);
  }

  /**
   * 辅助方法：是否是用户取消
   * 业务层常用： if (err.isUserCancel()) return;
   */
  isUserCancel(): boolean {
    return this.code === PayErrorCode.USER_CANCEL;
  }
}
