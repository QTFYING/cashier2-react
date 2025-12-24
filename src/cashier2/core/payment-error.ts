import { ErrorCategory, PayErrorCode } from '../types';

export class PayError extends Error {
  public readonly code: PayErrorCode;
  public readonly category: ErrorCategory;
  public readonly raw?: any; // 原始报错对象

  constructor(code: PayErrorCode, message: string, raw?: any) {
    super(message);
    this.name = 'PayError';
    this.code = code;
    this.message = message || this.getDefaultMessage(code);
    this.raw = raw;
    this.category = this.determineCategory(code);

    // 修复 TypeScript 继承 Error 原型链断裂问题
    Object.setPrototypeOf(this, PayError.prototype);
  }

  /**
   * [核心] 自动推导错误分类
   * 这一步把“如何处理错误”的知识内聚在 SDK 内部，而不是散落在 UI 代码里
   */
  private determineCategory(code: PayErrorCode): ErrorCategory {
    switch (code) {
      case PayErrorCode.USER_CANCEL:
      case PayErrorCode.PLUGIN_INTERRUPT:
        return ErrorCategory.SILENT;

      case PayErrorCode.TIMEOUT:
      case PayErrorCode.NETWORK_ERROR:
      case PayErrorCode.GATEWAY_ERROR:
      case PayErrorCode.PROVIDER_INTERNAL_ERROR:
        return ErrorCategory.RETRYABLE;

      case PayErrorCode.INSUFFICIENT_FUNDS:
      case PayErrorCode.RISK_CONTROL:
      case PayErrorCode.ORDER_CLOSED:
      case PayErrorCode.ORDER_EXPIRED:
      case PayErrorCode.INVALID_CONFIG:
      case PayErrorCode.NOT_SUPPORTED:
      case PayErrorCode.SIGNATURE_FAILED:
      case PayErrorCode.PLUGIN_ERROR:
        return ErrorCategory.FATAL;

      default:
        return ErrorCategory.UNKNOWN;
    }
  }

  private getDefaultMessage(code: PayErrorCode): string {
    const map: Record<string, string> = {
      [PayErrorCode.USER_CANCEL]: '用户取消支付',
      [PayErrorCode.NETWORK_ERROR]: '网络连接异常，请重试',
      [PayErrorCode.TIMEOUT]: '支付请求超时',
      [PayErrorCode.INSUFFICIENT_FUNDS]: '账户余额不足',
    };
    return map[code] || '支付过程发生未知错误';
  }

  // --- 语义化辅助方法 (Semantic Helpers) ---

  /** 是否应该静默处理 (不弹窗) */
  get isSilent(): boolean {
    return this.category === ErrorCategory.SILENT;
  }

  /** 是否建议用户重试 */
  get shouldRetry(): boolean {
    return this.category === ErrorCategory.RETRYABLE;
  }
}
