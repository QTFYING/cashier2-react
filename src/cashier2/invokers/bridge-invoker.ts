import type { PaymentInvoker } from '../types';

declare const JSBridge: any;

export class BridgeInvoker implements PaymentInvoker {
  async invoke(data: any) {
    return JSBridge.call('nativePay', data);
  }
}
