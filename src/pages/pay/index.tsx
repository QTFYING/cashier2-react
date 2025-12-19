import { AlipayCircleOutlined, WechatOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Form, QRCode, Radio, Result, Skeleton, Statistic, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import type { CreateOrderParams } from '../../api/payment';
import { useCashier } from '../../hooks';

// --- 1. 静态配置与纯函数抽离 (分离关注点) ---

// 状态映射字典：解决魔法字符串问题，统一管理文案和颜色
const STATUS_CONFIG: Record<string, { label: string; color: string; type: 'info' | 'success' | 'error' | 'warning' }> = {
  pending: { label: '待支付', color: 'blue', type: 'info' },
  processing: { label: '处理中', color: 'blue', type: 'info' },
  success: { label: '支付成功', color: 'green', type: 'success' },
  fail: { label: '支付失败', color: 'red', type: 'error' },
};

// 业务逻辑抽离：构建支付载荷
const buildPaymentPayload = (channel: string, orderId: string = 'ORDER_123') => {
  const basePayload = { orderId, amount: 100 };
  const extraMap: Record<string, any> = {
    wechat: { extra: { body: '测试商品', tradeType: 'NATIVE' } },
    alipay: { extra: { subject: '测试商品', mode: 'pc' } },
  };
  return { ...basePayload, ...(extraMap[channel] || {}) };
};

const Payment: React.FC = () => {
  const [form] = Form.useForm();
  const channel = Form.useWatch('channel', form);

  // 新增：用于控制是否显示“支付状态”栏，只有点击过支付才显示
  const [hasInitiated, setHasInitiated] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const { pay, loading, status, result, statusText, cashier } = useCashier();

  // 优化：提取二维码逻辑
  const qrValue = useMemo(() => {
    const action = result?.action;
    if (action?.type === 'qrcode' && action.value) return action.value;
    return result?.raw?.qrCode || result?.raw?.code_url || result?.raw?.qrCodeUrl || '';
  }, [result]);

  // 优化：倒计时逻辑 (简化版，依赖 Antd Statistic 内部处理，这里只做过期状态判断)
  const expireAt = result?.action?.expireAt;
  const isQrExpired = useMemo(() => {
    return expireAt ? Date.now() > expireAt : false;
  }, [expireAt, Date.now()]); // 注意：这里仅作简单的初始判断，实时过期交由 UI 组件视觉处理

  const handlePay = async (values: CreateOrderParams) => {
    try {
      setHasInitiated(true); // 标记已开始支付交互

      const payload = buildPaymentPayload(values.channel);
      setCurrentOrderId(payload.orderId);

      await pay(values.channel, payload);
    } catch (err) {
      console.error('支付发起失败', err);
    }
  };

  const onRefreshQr = async () => {
    const values = form.getFieldsValue() as CreateOrderParams;
    await handlePay(values);
  };

  // 轮询逻辑
  useEffect(() => {
    // 只有在 微信 + 有订单号 + 有二维码 + 状态非终态 时才轮询
    if (channel === 'wechat' && currentOrderId && qrValue && (status === 'pending' || status === 'processing')) {
      cashier.startPolling('wechat', currentOrderId);
    } else if (status === 'success' || status === 'fail') {
      cashier.stopPolling();
    }
  }, [cashier, channel, currentOrderId, qrValue, status]);

  useEffect(() => () => cashier.stopPolling(), [cashier]);

  // 派生当前状态配置
  const currentStatusConfig = status ? STATUS_CONFIG[status] : null;

  // --- 渲染辅助函数 (减少主 Render 函数体积) ---

  const renderRightContent = () => {
    // 场景 1: 支付成功 (优先级最高，覆盖二维码)
    if (status === 'success') {
      return <Result status="success" title="支付成功" subTitle="订单处理完成，您可以关闭此页面" className="py-4" />;
    }

    // 场景 2: 微信渠道 (显示二维码或骨架屏)
    if (channel === 'wechat') {
      return (
        <>
          <Typography.Title level={4}>微信扫码支付</Typography.Title>
          <div className="my-4 relative flex justify-center items-center" style={{ width: 216, height: 216 }}>
            {/* 核心防抖动策略：骨架屏与二维码绝对定位重叠，或互斥显示但占位相同 */}
            {loading || !qrValue ? (
              <Skeleton.Avatar shape="square" active size={216} className="absolute inset-0" />
            ) : (
              <QRCode value={qrValue} size={216} status={isQrExpired ? 'expired' : 'active'} onRefresh={onRefreshQr} />
            )}
          </div>

          <div className="flex flex-col items-center gap-2 min-h-[50px]">
            <Typography.Text>请使用微信扫描二维码完成支付</Typography.Text>
            {/* 只有在有过期时间且非成功状态下显示倒计时 */}
            <div className={expireAt && status !== 'success' ? '' : 'invisible'}>
              <Statistic.Countdown
                value={expireAt || Date.now() + 60000}
                format="mm:ss"
                valueStyle={{ fontSize: 16 }}
                prefix="有效期："
                onFinish={onRefreshQr} // 倒计时结束自动刷新或触发过期态
              />
            </div>
          </div>
        </>
      );
    }

    // 场景 3: 默认/支付宝 (占位)
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
    <div className="max-w-6xl mx-auto p-6">
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

            <Form form={form} onFinish={handlePay} initialValues={{ channel: 'alipay' }} layout="vertical">
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

              {/* 改造点 4: 仅在发起支付后显示状态栏 */}
              {hasInitiated && (
                <Form.Item label="支付状态">
                  <div className="min-h-[60px]">
                    <div className="flex items-center gap-2 mb-2">
                      {/* 改造点 2: 显示中文状态 */}
                      <Tag color={currentStatusConfig?.color || 'default'}>{currentStatusConfig?.label || '等待中'}</Tag>
                      {/* 如果有接口返回的详细文案statusText也可以保留，或者只用中文映射 */}
                    </div>
                    {status === 'pending' && <Alert type="info" message="请按指引完成支付" showIcon />}
                    {status === 'success' && <Alert type="success" message="支付已完成" showIcon />}
                    {status === 'fail' && <Alert type="error" message="支付遇到问题，请重试" showIcon />}
                  </div>
                </Form.Item>
              )}
              {/* 为了保持高度稳定，如果未发起支付，用空 div 占位 (可选，取决于是否希望高度自适应) */}
              {!hasInitiated && <div className="h-[92px]" />}

              <Form.Item className="mb-0 mt-4">
                <div className="flex items-center gap-3">
                  <Button type="primary" htmlType="submit" size="large" loading={loading} className="w-32">
                    {hasInitiated ? '重新支付' : '去支付'}
                  </Button>
                  {/* 仅在微信且显示二维码时允许刷新 */}
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

        {/* 右侧卡片：核心交互区 */}
        <Card className="shadow-sm flex flex-col">
          {/* 保持固定高度，防止 Result 组件和 QRCode 组件高度差异导致抖动 */}
          <div className="flex flex-col items-center justify-center min-h-[340px] h-full w-full relative">{renderRightContent()}</div>
        </Card>
      </div>

      <Divider />

      {/* 调试信息 */}
      <Card title="调试信息" className="shadow-sm">
        <div className="max-h-64 overflow-y-auto bg-gray-50 p-4 rounded border border-gray-100">
          {/* 增加判断，没数据时不显示空对象 */}
          {hasInitiated && result ? (
            <pre className="text-xs whitespace-pre-wrap m-0 font-mono text-gray-600">{JSON.stringify(result, null, 2)}</pre>
          ) : (
            <span className="text-gray-400 text-xs">暂无调试数据，请点击支付后查看</span>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Payment;
