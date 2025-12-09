import Mock from 'mockjs';
import { MockMethod } from 'vite-plugin-mock';

const Random = Mock.Random;

export default [
  {
    url: '/api/payment/unifiedOrder',
    method: 'post',
    response: ({ body }) => {
      const { channel, amount, currency } = body;
      const orderId = Random.id();

      let payUrl = '';
      if (channel === 'alipay') {
        payUrl = `https://qr.alipay.com/${Random.string('lower', 16)}`;
      } else if (channel === 'wechat') {
        payUrl = `weixin://wxpay/bizpayurl?pr=${Random.string('lower', 16)}`;
      }

      return {
        code: 200,
        message: 'Order created successfully',
        data: {
          orderId,
          channel,
          amount,
          currency,
          payUrl, // In real world this could be a QR code URL or a deep link
          status: 'PENDING',
        },
      };
    },
  },
  {
    url: '/api/payment/pay',
    method: 'post',
    response: ({ body }) => {
      // Simulate payment processing
      return {
        code: 200,
        message: 'Payment successful',
        data: {
          orderId: body.orderId,
          status: 'COMPLETED',
          transactionId: Random.guid(),
          timestamp: new Date().toISOString(),
        },
      };
    },
  },
] as MockMethod[];
