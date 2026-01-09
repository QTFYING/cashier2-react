import { AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Form, message, Modal, QRCode, Radio, Result, Skeleton, Statistic, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import type { CreateOrderParams } from '../../api/payment';
import { PayError } from '../../cashier2';
import { useCashier } from '../../hooks';

const STATUS_COLOR = {
  success: 'green',
  fail: 'red',
  processing: 'blue',
  default: 'default',
  pending: 'default',
  refunded: 'warning',
  cancel: 'orange',
};

const Payment: React.FC = () => {
  const [form] = Form.useForm();
  const channel = Form.useWatch('channel', form);

  // 交互状态控制
  const [isCreated, setCreatedSt] = useState(false);
  const [showLateComponent, setShowLateComponent] = useState(false);
  // 用于控制二维码过期视觉状态
  const [isQrExpired, setIsQrExpired] = useState(false);

  const { reset, pay, orderId, create, loading, status, result, statusText, cashier } = useCashier();

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
      setCreatedSt(true);

      const base = { amount: 100 };
      const extraMap: Record<string, any> = {
        wechat: { extra: { body: '测试商品', tradeType: 'NATIVE' } },
        alipay: { extra: { subject: '测试商品', mode: 'pc' } },
      };

      // 演示：点击支付后，延迟 2秒 挂载
      setTimeout(() => setShowLateComponent(true), 20000);

      const payload = { ...base, orderId, ...(extraMap[channel] || {}) };
      await pay(values.channel, payload);

      // 发起新支付时，重置过期标记
      setIsQrExpired(false);
    } catch (err) {
      // 1. 如果是 PayError，利用增强能力处理
      if (err instanceof PayError) {
        // A. 静默处理：用户自己关掉的，什么都不用做
        if (err.isSilent) {
          message.warning('用户取消');
          return;
        }

        // B. 可重试：显示“重试”按钮或 Toast
        if (err.shouldRetry) {
          message.error({ content: '网络有点卡，请重试' });
          return;
        }

        // C. 致命错误：显示详细错误信息
        Modal.error({ title: '支付失败', content: err.message });
      } else {
        // 2. 未知程序错误
        console.error(err);
        message.error('系统异常');
      }
    }
  };

  const handleReset = () => {
    setCreatedSt(false);
    setIsQrExpired(false);
    form.resetFields(['channel']); // 可选：是否重置渠道
    // 注意：这里可能需要调用 cashier.reset() 如果你的 hook 暴露了重置状态的方法
    // 假设 hook 没有暴露 reset，通过组件卸载/重挂载或状态清理来模拟
    reset();
    // window.location.reload(); // 最简单的清理，实际项目中应调用 store.reset()
  };

  const onRefreshQr = async () => {
    // 刷新二维码本质是使用原参数重新请求一次支付接口
    const values = form.getFieldsValue() as CreateOrderParams;
    await onFinish(values);
  };

  // 轮询控制
  useEffect(() => {
    if (channel === 'wechat' && qrValue && (status === 'pending' || status === 'processing')) {
      cashier.startPolling('wechat', orderId);
    } else if (status === 'success' || status === 'fail') {
      cashier.stopPolling();
    }
  }, [cashier, channel, qrValue, status, orderId]);

  // 组件卸载清理
  useEffect(() => () => cashier.stopPolling(), [cashier]);

  // --- 渲染逻辑 ---

  // 计算按钮文案和状态
  const getButtonProps = () => {
    if (status === 'success') return { text: '下一单', disabled: false };
    if (isCreated) return { text: '重新支付', disabled: loading };
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
            {/* 骨架屏与二维码互斥显示 */}
            {loading || !qrValue ? (
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
            {loading && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] pt-4 rounded">
                <Skeleton active paragraph={{ rows: 6 }} title={false} />
              </div>
            )}

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
                      <Tag color={STATUS_COLOR[status!] || 'default'}>{statusText || '等待中'}</Tag>
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

      {showLateComponent && <LateSubscriber />}
    </div>
  );
};

// --- 教学演示组件：模拟只用 EventBus 的“后知后觉” ---
// 这个组件只监听 emit，不读取 current state
const LateSubscriber: React.FC = () => {
  // 正确写法：从 hook 中获取响应式状态
  const { cashier, status } = useCashier();
  const [localStatus, setLocalStatus] = useState('idle');

  useEffect(() => {
    console.log('👀 [LateComponent] 我挂载了，开始监听事件...');

    // 纯 EventBus 写法：只听事件
    const onStart = () => {
      console.log('👂 [LateComponent] 听到 start 事件');
      setLocalStatus('processing');
    };
    const onSuccess = () => setLocalStatus('success');

    // cashier.on('start', onStart); // SDK 没有 start 事件，通常是 statusChange
    cashier.on('statusChange', (p: any) => {
      if (p.status === 'processing' || p.status === 'pending') onStart();
    });

    cashier.on('success', onSuccess);

    return () => {
      // cleanup
    };
  }, [cashier]);

  return (
    <div className="mt-4 p-4 border border-red-500 bg-red-50 rounded">
      <Typography.Title level={5} type="danger">
        我是后知后觉的组件 (EventBus Mode)
      </Typography.Title>
      <div className="text-gray-600 mb-2">
        我延迟了 2秒 才出现。
        <br />
        因为我只监听事件(Event)，而支付开始的事件在 2秒前 已经发完了。
        <br />
        <b>所以我完全不知道现在正在支付中！</b>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 font-bold border border-red-200 bg-red-100 p-2 rounded">
          EventBus 视角 (事件): <br />
          <span className="text-red-600">
            {localStatus} - {status}
          </span>
        </div>
        <div className="flex-1 font-bold border border-green-200 bg-green-100 p-2 rounded">
          Reactive 视角 (状态): <br />
          <span className="text-green-600">{status} (✅ 正确)</span>
        </div>
      </div>
    </div>
  );
};

export default Payment;
