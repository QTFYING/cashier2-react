import { AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { Button, Form, Radio } from 'antd';
import React, { useState } from 'react';
import type { CreateOrderParams } from '../../api/payment';
import { useCashier } from '../../hooks';

const Payment: React.FC = () => {
  const [form] = Form.useForm();

  // 一行代码拿到 SDK 实例
  const cashier = useCashier();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      // 直接调用 Core SDK 的能力
      const res = await cashier.execute('wechat', { orderId: '123', amount: 100 });
      console.log('支付结果', res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = (values: CreateOrderParams) => {
    console.log('x-1', values);
    void handlePay();
  };

  return (
    <Form form={form} onFinish={onFinish} initialValues={{ channel: 'alipay' }}>
      <Form.Item name="channel" label="支付方式" rules={[{ required: true }]}>
        <Radio.Group>
          <Radio.Button value="alipay">
            <AlipayCircleOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            支付宝
          </Radio.Button>
          <Radio.Button value="wechat">
            <WechatOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            微信
          </Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" size="large">
          去支付
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Payment;
