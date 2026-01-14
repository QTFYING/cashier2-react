import { PayResult, PaySt } from '@my-cashier/types';
import { Card, QRCode, Result, Skeleton, Statistic, Typography } from 'antd';
import { FC, useMemo } from 'react';

interface PaymentResultProps {
  status: PaySt | 'idle' | null;
  result: PayResult | null;
  channel: string;
  isQrExpired: boolean;
  setIsQrExpired: (expired: boolean) => void;
  onRefreshQr: () => void;
}

export const PaymentResult: FC<PaymentResultProps> = ({ status, result, channel, isQrExpired, setIsQrExpired, onRefreshQr }) => {
  const qrValue = useMemo(() => {
    const action = result?.action;
    if (action?.type === 'qrcode' && action.value) return action.value;
    return result?.raw?.code_url;
  }, [result]);

  const expireAt = result?.raw?.expired_time;

  const renderContent = () => {
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
    <Card className="shadow-sm flex flex-col">
      <div className="flex flex-col items-center justify-center min-h-[340px] h-full w-full relative">{renderContent()}</div>
    </Card>
  );
};
