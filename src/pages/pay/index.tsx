import { AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';

import { useCashier } from '@my-cashier/react';
import { Alert, Button, Card, Divider, Form, message, Modal, QRCode, Radio, Result, Skeleton, Statistic, Tag, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import type { CreateOrderParams } from '../../api/payment';
import service from '../../api/request';
import { STATUS_COLOR, STATUS_TEXT } from './enums';

const Payment: React.FC = () => {
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

  const qrValue = useMemo(() => {
    const action = result?.action;
    if (action?.type === 'qrcode' && action.value) return action.value;
    return result?.raw?.code_url;
  }, [result]);

  const expireAt = result?.raw?.expired_time;

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
      const res = inferErrorType(err);
      switch (res.type.toUpperCase()) {
        case 'SILENT':
          message.warning('用户取消');
          break;
        case 'RETRY':
          message.error({ content: '网络有点卡，请重试' });
          break;
        case 'FATAL':
          Modal.error({ title: '支付失败', content: res.message });
          break;
        case 'UNKNOWN':
          console.error(res.error);
          message.error('系统异常');
          break;
      }
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

  // --- 渲染逻辑 ---

  // 计算按钮文案和状态
  const getButtonProps = () => {
    if (status === 'success') return { text: '下一单', disabled: false };
    if (status === 'fail') return { text: '重新支付', disabled: loading };
    return { text: '去支付', disabled: loading };
  };

  const btnProps = getButtonProps();

  const renderRightContent = () => {
    // 1. 成功态：最高优先级
    if (status === 'success') {
      return <Result status="success" title="支付成功" subTitle="订单处理完成" className="py-4 animate-fade-in" />;
    }

    // 2. 微信二维码态
    if (channel === 'wechat') {
      return (
        <>
          <Typography.Title level={4}>微信扫码支付</Typography.Title>
          <div className="my-4 relative flex justify-center items-center w-216px h-216px">
            {/* 骨架屏与二维码互斥显示: 只要有码就显示码，否则显示骨架屏 */}
            {!qrValue ? (
              <Skeleton.Avatar shape="square" active size={216} className="absolute inset-0" />
            ) : (
              <QRCode value={qrValue} size={216} status={isQrExpired ? 'expired' : 'active'} onRefresh={onRefreshQr} />
            )}
          </div>

          <div className="flex flex-col items-center gap-2 min-h-[50px]">
            <Typography.Text>请使用微信扫描二维码完成支付</Typography.Text>
            {/* 倒计时组件：依靠 onFinish 驱动状态变化，解决 Date.now() 依赖问题 */}
            <div className={expireAt && !isQrExpired ? '' : 'invisible'}>
              <Statistic.Timer type="countdown" value={expireAt} format="mm:ss" prefix="有效期：" onFinish={() => setIsQrExpired(true)} />
            </div>
          </div>
        </>
      );
    }

    // 3. 默认/支付宝态
    return (
      <div className="flex flex-col items-center justify-center w-full animate-fade-in">
        <Typography.Text type="secondary" className="mb-4">
          {channel === 'alipay' ? '支付宝支付将跳转新窗口' : '选择支付方式后显示'}
        </Typography.Text>
        <div className="w-32 h-32 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
          <span className="text-gray-300">No QR</span>
        </div>
      </div>
    );
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

        {/* 右侧卡片 */}
        <Card className="shadow-sm flex flex-col">
          <div className="flex flex-col items-center justify-center min-h-[340px] h-full w-full relative">{renderRightContent()}</div>
        </Card>
      </div>

      <Divider />

      <Card title="调试信息" className="shadow-sm">
        <div className="max-h-64 overflow-y-auto bg-gray-50 p-4 rounded border border-gray-100">
          {isCreated && result ? (
            <pre className="text-xs whitespace-pre-wrap m-0 font-mono text-gray-600">{JSON.stringify(result, null, 2)}</pre>
          ) : (
            <span className="text-gray-400 text-xs">暂无调试数据</span>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Payment;
