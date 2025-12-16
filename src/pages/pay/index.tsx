import { AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { Button, Form, Radio } from 'antd';
import React from 'react';
import type { CreateOrderParams } from '../../api/payment';
import { useCashier } from '../../hooks';

const Payment: React.FC = () => {
  const [form] = Form.useForm();

  const { pay, loading, status } = useCashier();

  const onFinish = async (values: CreateOrderParams) => {
    try {
      const res = await pay(values.channel, { orderId: '123', amount: 100 });
      console.log('支付结果', res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Form form={form} onFinish={onFinish} initialValues={{ channel: 'alipay' }}>
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

      <Form.Item name="channel" label="支付状态">
        <div>{status}</div>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" size="large" loading={loading}>
          去支付
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Payment;
