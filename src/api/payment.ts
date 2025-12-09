import { post } from './request';

export interface CreateOrderParams {
  amount: number;
  currency: string;
  channel: 'alipay' | 'wechat';
  recipient: string;
  description?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  channel: string;
  amount: number;
  currency: string;
  payUrl: string;
  status: string;
}

export interface PaymentResult {
  orderId: string;
  status: string;
  transactionId: string;
  timestamp: string;
}

// Simulate unified order creation (going to Alipay/WeChat)
export const createUnifiedOrder = (data: CreateOrderParams) => {
  return post<CreateOrderResponse>('/payment/unifiedOrder', data);
};

// Simulate confirming the payment
export const confirmPayment = (orderId: string) => {
  return post<PaymentResult>('/payment/pay', { orderId });
};
