import { AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { PaySt } from '@my-cashier/types';
import { Alert, Button, Card, Form, FormInstance, Radio, Tag } from 'antd';
import { FC } from 'react';
import type { CreateOrderParams } from '../../api/payment';
import { STATUS_COLOR, STATUS_TEXT } from './enums';

interface PaymentFormProps {
  form: FormInstance;
  onFinish: (values: CreateOrderParams) => Promise<void>;
  loading: boolean;
  status: PaySt | 'idle' | null;
  orderId: string;
  channel: string;
  isCreated: boolean;
  onRefreshQr: () => void;
  btnProps: { text: string; disabled: boolean };
}

export const PaymentForm: FC<PaymentFormProps> = ({ form, onFinish, loading, status, orderId, channel, isCreated, onRefreshQr, btnProps }) => {
  return (
    <Card className="shadow-sm flex flex-col justify-center">
      <div className="relative min-h-[340px]">
        <Form form={form} onFinish={onFinish} initialValues={{ channel: 'alipay' }} layout="vertical">
          <Form.Item name="orderId" label="订单号">
            <span className="text-gray-400 text-xs">{orderId || '订单号创建中～'}</span>
          </Form.Item>

          <Form.Item name="channel" label="支付方式" rules={[{ required: true }]}>
            <Radio.Group className="w-full">
              <Radio.Button value="alipay" className="mr-4 text-center w-32 h-10 leading-10">
                <AlipayCircleOutlined className="text-[#1677ff] mr-2" />
                支付宝
              </Radio.Button>
              <Radio.Button value="wechat" className="text-center w-32 h-10 leading-10">
                <WechatOutlined className="text-[#52c41a] mr-2" />
                微信
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {isCreated && (
            <Form.Item label="支付状态">
              <div className="min-h-[60px]">
                <div className="flex items-center gap-2 mb-2">
                  <Tag color={STATUS_COLOR[status!] || 'default'}>{STATUS_TEXT[status!] || '等待中'}</Tag>
                </div>
                {status === 'pending' && <Alert type="info" description="请按指引完成支付" showIcon />}
                {status === 'success' && <Alert type="success" description="支付已完成" showIcon />}
                {status === 'fail' && <Alert type="error" description="支付遇到问题，请重试" showIcon />}
              </div>
            </Form.Item>
          )}

          {!isCreated && <div className="h-[92px]" />}

          <Form.Item className="mb-0 mt-4">
            <div className="flex items-center gap-3">
              <Button type="primary" htmlType="submit" size="large" loading={loading} disabled={btnProps.disabled} className="w-32">
                {btnProps.text}
              </Button>

              {channel === 'wechat' && status !== 'success' && (
                <Button size="large" onClick={onRefreshQr} disabled={loading}>
                  刷新二维码
                </Button>
              )}
            </div>
          </Form.Item>
        </Form>
      </div>
    </Card>
  );
};
