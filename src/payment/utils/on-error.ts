import { inferErrorType } from '@my-cashier/react';
import { message, Modal } from 'antd';

export function onPayError(err: any) {
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
      message.error('系统异常');
      break;
  }
}
