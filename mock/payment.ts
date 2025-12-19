import Mock from 'mockjs';
import type { MockMethod } from 'vite-plugin-mock';

export default [
  {
    url: '/api/payment/alipay',
    method: 'post',
    response: ({ body }: { body: any }) => {
      const { product_code } = body;
      // 手机网页支付：返回表单
      if (product_code === 'QUICK_WAP_WAY') {
        return {
          code: 200,
          message: 'Order created successfully',
          data: '<form id="alipaysubmit" name="alipaysubmit" action="https://openapi.alipaydev.com/gateway.do?charset=UTF-8" method="POST"><input type="hidden" name="biz_content" value="{}"/><input type="submit" value="ok" style="display:none;"></form><script>document.forms["alipaysubmit"].submit();</script>',
        };
      }
      // App 支付：返回 orderStr
      if (product_code === 'QUICK_MSECURITY_PAY') {
        return {
          code: 200,
          message: 'Order created successfully',
          data: {
            orderStr:
              'app_id=2016080600180053&biz_content=%7B%22body%22%3A%22Mock%20Data%22%2C%22subject%22%3A%22App%20Pay%22%2C%22out_trade_no%22%3A%2220170125test01%22%2C%22timeout_express%22%3A%2230m%22%2C%22total_amount%22%3A%220.01%22%2C%22product_code%22%3A%22QUICK_MSECURITY_PAY%22%7D&charset=utf-8&format=json&method=alipay.trade.app.pay&notify_url=http%3A%2F%2Fwww.test.com%2Falipay%2Fnotify_url.php&sign_type=RSA2&timestamp=2016-08-25%2020%3A26%3A31&version=1.0&sign=cYmuUnKi5QdBsoZEAb4rMEnw%2BXLPrPPHLDlpbKXY9A39irqjL07cIl7vFpo%2BbV%2BvS%2F8Kddr3up%2F0%2F629%2FGT5g%3D%3D',
          },
        };
      }
      // 电脑网站支付：返回表单
      if (product_code === 'FAST_INSTANT_TRADE_PAY') {
        return {
          code: 200,
          message: 'Order created successfully',
          data: '<form id="alipaysubmit" name="alipaysubmit" action="https://openapi.alipaydev.com/gateway.do?charset=UTF-8" method="POST"><input type="hidden" name="biz_content" value="{}"/><input type="submit" value="ok" style="display:none;"></form><script>document.forms["alipaysubmit"].submit();</script>',
        };
      }
      // 当面付：返回二维码链接
      if (product_code === 'FACE_TO_FACE_PAY' || product_code === 'FACE_TO_FACE_PAYMENT') {
        return {
          code: 200,
          message: 'Order created successfully',
          data: {
            qrCodeUrl: 'https://qr.alipay.com/bax07744lxqnoq7zjhxd6099',
          },
        };
      }
      return {
        code: 200,
        message: 'Order created successfully',
        data: {},
      };
    },
  },
  {
    url: '/api/payment/wechat',
    method: 'post',
    response: ({ body }: { body: any }) => {
      const { trade_type } = body;
      // JSAPI 支付 / 小程序支付
      if (trade_type === 'JSAPI') {
        return {
          code: 200,
          message: 'Payment successful',
          data: {
            // 这 5 个参数是 uni.requestPayment 或 wx.chooseWXPay 直接需要的
            appId: 'wxd678efh567hg6787',
            timeStamp: String(Math.floor(Date.now() / 1000)),
            nonceStr: '5K8264ILTKCH16CQ2502SI8ZNMTM67VS',
            package: 'prepay_id=wx201410272009395522657a690389285100',
            signType: 'MD5',
            paySign: 'B552ED6B279343CB493C5DD0D78AB241', // 服务端返回签名
          },
        };
      }
      // H5 支付
      if (trade_type === 'MWEB') {
        return {
          code: 200,
          message: 'Payment successful',
          data: {
            transaction_id: Mock.Random.uuid(),
            expired_time: Date.now() + 60 * 1000, // 1 分钟后过期
            mweb_url: 'https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=wx2016121516420242444321ca0631331346&package=1495451171',
          },
        };
      }
      // Native 扫码支付
      if (trade_type === 'NATIVE') {
        return {
          code: 200,
          message: 'Payment successful',
          data: {
            transaction_id: Mock.Random.uuid(),
            expired_time: Date.now() + 60 * 1000, // 1 分钟后过期
            code_url: 'weixin://wxpay/bizpayurl?pr=1234567',
          },
        };
      }
      return {
        code: 200,
        message: 'Payment successful',
        data: {},
      };
    },
  },
] as MockMethod[];
