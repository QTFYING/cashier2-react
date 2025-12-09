import { AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, Card, Form, Input, InputNumber, message, Modal, Radio, Result, Select, Spin } from 'antd';
import React, { useState } from 'react';
import type { CreateOrderParams } from '../../api/payment';
import { confirmPayment, createUnifiedOrder } from '../../api/payment';

const { Option } = Select;

const Payment: React.FC = () => {
  const [successData, setSuccessData] = useState<any>(null);
  const [form] = Form.useForm();
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  // 1. Create Unified Order
  const { run: runCreateOrder, loading: creatingOrder } = useRequest(createUnifiedOrder, {
    manual: true,
    onSuccess: (data) => {
      message.success('Order created successfully!');
      setCurrentOrder(data);
      setPayModalVisible(true);
    },
    onError: (err) => {
      message.error(`Order creation failed: ${err.message}`);
    },
  });

  // 2. Confirm Payment (Simulate user paying)
  const { run: runConfirmPay, loading: confirmingPay } = useRequest(confirmPayment, {
    manual: true,
    onSuccess: (data) => {
      setPayModalVisible(false);
      setSuccessData(data);
      message.success('Payment successful!');
      form.resetFields();
    },
    onError: (err) => {
      message.error(`Payment failed: ${err.message}`);
    },
  });

  const onFinish = (values: CreateOrderParams) => {
    runCreateOrder(values);
  };

  const handlePay = () => {
    if (currentOrder?.orderId) {
      runConfirmPay(currentOrder.orderId);
    }
  };

  if (successData) {
    return (
      <Result
        status="success"
        title="Payment Successful!"
        subTitle={`Order ID: ${successData.orderId} | Transaction ID: ${successData.transactionId}`}
        extra={[
          <Button type="primary" key="console" onClick={() => {
            setSuccessData(null);
            setCurrentOrder(null);
          }}>
            Make Another Payment
          </Button>,
        ]}
      />
    );
  }

  return (
    <>
      <Card title="Initiate Payment" style={{ maxWidth: 600, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ currency: 'USD', channel: 'alipay' }}
        >
          <Form.Item
            name="recipient"
            label="Recipient"
            rules={[{ required: true, message: 'Please enter recipient' }]}
          >
            <Input placeholder="Merchant Name or ID" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              step={0.01}
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            name="currency"
            label="Currency"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="USD">USD - US Dollar</Option>
              <Option value="EUR">EUR - Euro</Option>
              <Option value="CNY">CNY - Chinese Yuan</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="channel"
            label="Payment Method"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio.Button value="alipay">
                <AlipayCircleOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                Alipay
              </Radio.Button>
              <Radio.Button value="wechat">
                <WechatOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                WeChat Pay
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} placeholder="Order description..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={creatingOrder} block size="large">
              Place Order & Pay
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Payment Simulation Modal */}
      <Modal
        title={`Pay with ${currentOrder?.channel === 'alipay' ? 'Alipay' : 'WeChat Pay'}`}
        open={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPayModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="pay" type="primary" onClick={handlePay} loading={confirmingPay}>
            Confirm Payment
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: 20 }}>
          <p>Scanning QR Code...</p>
          <div style={{
            width: 200,
            height: 200,
            background: '#f0f0f0',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* In a real app, this would be a QR code image */}
            <span style={{ fontSize: 24, fontWeight: 'bold', color: '#888' }}>QR CODE</span>
          </div>
          <p style={{ marginTop: 20 }}>
            Amount: <strong>{currentOrder?.amount} {currentOrder?.currency}</strong>
          </p>
          {confirmingPay && <Spin tip="Processing Payment..." style={{ marginTop: 10 }} />}
        </div>
      </Modal>
    </>
  );
};

export default Payment;
