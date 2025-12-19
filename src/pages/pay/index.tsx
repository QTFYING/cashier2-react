import { AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Form, QRCode, Radio, Skeleton, Statistic, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import type { CreateOrderParams } from '../../api/payment';
import { useCashier } from '../../hooks';

const Payment: React.FC = () => {
  const [form] = Form.useForm();
  const channel = Form.useWatch('channel', form);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const { pay, loading, status, result, statusText, cashier } = useCashier();

  const qrValue = useMemo(() => {
    const a = result?.action;
    if (a?.type === 'qrcode' && a.value) return a.value;
    const raw = result?.raw;
    return raw?.qrCode || raw?.code_url || raw?.qrCodeUrl || '';
  }, [result]);

  const expireAt = result?.action?.expireAt;
  const [isQrExpired, setIsQrExpired] = useState(false);
  useEffect(() => {
    if (!expireAt) return;
    const timer = setInterval(() => {
      const expired = Date.now() > expireAt;
      if (expired !== isQrExpired) setIsQrExpired(expired);
    }, 1000);
    return () => clearInterval(timer);
  }, [expireAt, isQrExpired]);

  const onFinish = async (values: CreateOrderParams) => {
    try {
      const payload = { orderId: 'ORDER_123', amount: 100 };
      setCurrentOrderId(payload.orderId);
      if (values.channel === 'wechat') {
        Object.assign(payload, {
          extra: { body: '测试商品', tradeType: 'NATIVE' },
        });
      }
      if (values.channel === 'alipay') {
        Object.assign(payload, {
          extra: { subject: '测试商品', mode: 'pc' },
        });
      }
      const res = await pay(values.channel, payload);
      console.log('支付结果', res);
    } catch (err) {
      console.error(err);
    }
  };

  const onRefreshQr = async () => {
    const values = form.getFieldsValue() as CreateOrderParams;
    await onFinish(values);
  };

  useEffect(() => {
    if (channel === 'wechat' && currentOrderId && qrValue && (result?.status === 'pending' || result?.status === 'processing')) {
      cashier.startPolling('wechat', currentOrderId);
    }
  }, [cashier, channel, currentOrderId, qrValue, result?.status]);

  useEffect(() => {
    return () => {
      cashier.stopPolling();
    };
  }, [cashier]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Typography.Title level={3} className="m-0">
        在线收银台
      </Typography.Title>
      <Typography.Text type="secondary">请选择支付方式并完成付款</Typography.Text>
      <Divider />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <div className="relative">
            {loading ? (
              <div className="p-2">
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ) : null}
            <Form form={form} onFinish={onFinish} initialValues={{ channel: 'alipay' }} layout="vertical" className={loading ? 'opacity-60 pointer-events-none' : ''}>
              <Form.Item name="channel" label="支付方式" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio.Button value="alipay">
                    <AlipayCircleOutlined className="text-[#1677ff] mr-2" />
                    支付宝
                  </Radio.Button>
                  <Radio.Button value="wechat">
                    <WechatOutlined className="text-[#52c41a] mr-2" />
                    微信
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="支付状态">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Tag color={status === 'success' ? 'green' : status === 'fail' ? 'red' : 'blue'}>{status}</Tag>
                    <Typography.Text>{statusText}</Typography.Text>
                  </div>
                  {status === 'pending' ? <Alert type="info" message="请按指引完成支付或扫码支付" showIcon /> : <div className="h-6" />}
                </div>
              </Form.Item>
              <Form.Item>
                <div className="flex items-center gap-3">
                  <Button type="primary" htmlType="submit" size="large" loading={loading}>
                    去支付
                  </Button>
                  <Button size="large" onClick={onRefreshQr} disabled={loading}>
                    刷新二维码
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        </Card>
        <Card className="shadow-sm">
          <div className="flex flex-col items-center min-h-64 relative">
            {channel === 'wechat' && qrValue ? (
              <>
                <Typography.Title level={4}>微信扫码支付</Typography.Title>
                <div className="my-2">
                  {loading ? <Skeleton.Avatar shape="square" active size={216} /> : <QRCode value={qrValue} size={216} status={isQrExpired ? 'expired' : 'active'} />}
                </div>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <Typography.Text>请使用微信扫描二维码完成支付</Typography.Text>
                  {expireAt ? <Statistic.Countdown title="二维码有效期" value={expireAt} format="mm:ss" /> : null}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 w-full px-6">
                    <Skeleton.Input active style={{ width: 180 }} />
                    <Skeleton.Avatar shape="square" active size={216} />
                    <Skeleton active paragraph={{ rows: 2 }} className="w-full" />
                  </div>
                ) : (
                  <Typography.Text type="secondary">选择微信支付后，将在此显示二维码</Typography.Text>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
      <Divider />
      <Card title="调试信息" className="shadow-sm">
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
      </Card>
    </div>
  );
};

export default Payment;
