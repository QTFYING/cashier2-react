import { useCashier } from '@my-cashier/react';
import { Divider, Form, Typography } from 'antd';
import { useState } from 'react';
import type { CreateOrderParams } from '../../api/payment';
import service from '../../api/request';
import { onPayError } from '../../payment/utils';
import { DebugPanel } from './debug-panel';
import { PaymentForm } from './payment-form';
import { PaymentResult } from './payment-result';

const Payment = () => {
  const [form] = Form.useForm();
  const channel = Form.useWatch('channel', form);

  // 用于控制二维码过期视觉状态
  const [isQrExpired, setIsQrExpired] = useState(false);

  const { reset, pay, loading, status, result, cashier, inferErrorType } = useCashier();
  const [orderId, setOrderId] = useState<string>('');

  const create = async (params: any) => {
    try {
      cashier.store.setState({ loading: true });
      const res = await service.post('/payment/create', params);
      const { orderId } = res.data;
      setOrderId(orderId);
      return orderId;
    } finally {
      cashier.store.setState({ loading: false });
    }
  };

  const isCreated = status !== null;

  const onFinish = async (values: CreateOrderParams) => {
    // 如果已经支付成功，点击按钮则是“下一单”的逻辑：重置状态
    if (status === 'success') {
      handleReset();
      return;
    }

    try {
      const orderId = await create({ amount: 100, productId: 'A123456789' });

      const base = { amount: 100 };
      const extraMap: Record<string, any> = {
        wechat: { extra: { body: '测试商品', tradeType: 'NATIVE' } },
        alipay: { extra: { subject: '测试商品', mode: 'pc' } },
      };

      const payload = { ...base, orderId, ...(extraMap[channel] || {}), autoPoll: true };
      await pay(values.channel, payload);

      // 发起新支付时，重置过期标记
      setIsQrExpired(false);
    } catch (err) {
      onPayError(err, inferErrorType);
    }
  };

  const handleReset = () => {
    setIsQrExpired(false);
    form.resetFields(['channel']);
    reset();
  };

  const onRefreshQr = async () => {
    const values = form.getFieldsValue() as CreateOrderParams;
    await onFinish(values);
  };

  // 计算按钮文案和状态
  const getButtonProps = () => {
    if (status === 'success') return { text: '下一单', disabled: false };
    if (status === 'fail') return { text: '重新支付', disabled: loading };
    return { text: '去支付', disabled: loading };
  };

  return (
    <div className="max-w-6xl mx-auto p-6" key={orderId}>
      <Typography.Title level={3} className="m-0">
        在线收银台
      </Typography.Title>
      <Typography.Text type="secondary">请选择支付方式并完成付款</Typography.Text>
      <Divider />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* 左侧卡片 */}
        <PaymentForm
          form={form}
          onFinish={onFinish}
          loading={loading}
          status={status}
          orderId={orderId}
          channel={channel}
          isCreated={isCreated}
          onRefreshQr={onRefreshQr}
          btnProps={getButtonProps()}
        />

        {/* 右侧卡片 */}
        <PaymentResult status={status} result={result} channel={channel} isQrExpired={isQrExpired} setIsQrExpired={setIsQrExpired} onRefreshQr={onRefreshQr} />
      </div>

      <Divider />

      <DebugPanel isCreated={isCreated} result={result} />
    </div>
  );
};

export default Payment;
