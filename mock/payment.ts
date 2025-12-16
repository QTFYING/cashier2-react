import * as Mock from 'mockjs';
import type { MockMethod } from 'vite-plugin-mock';

const Random = Mock.Random;

export default [
  {
    url: '/api/payment/unifiedOrder',
    method: 'post',
    response: ({ body }: { body: any }) => {
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
    url: '/api/payment/wechat',
    method: 'post',
    response: ({ body }: { body: any }) => {
      return {
        code: 200,
        message: 'Payment successful',
        data: {
          return_msg: 'OK',
          appid: 'wxd678efh567hg6787',
          mch_id: '1230000109',
          nonce_str: '5K8264ILTKCH16CQ2502SI8ZNMTM67VS',
          sign: 'B552ED6B279343CB493C5DD0D78AB241',
          return_code: 'SUCCESS',
          prepay_id: body.orderId,
          trade_type: 'JSAPI',
          timestamp: new Date().toISOString(),
        },
      };
    },
  },
] as MockMethod[];
