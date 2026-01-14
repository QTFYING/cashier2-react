import { ErrorCategory } from '@my-cashier/types';
import { message, Modal } from 'antd';

interface IErrorTypeDesc {
  type: keyof typeof ErrorCategory;
  desc: string;
  error: any;
}

export function onPayError(err: any, inferErrorType: (err: any) => IErrorTypeDesc) {
  const res = inferErrorType(err);
  switch (res.type.toUpperCase()) {
    case 'SILENT':
      message.warning('用户取消');
      break;
    case 'RETRY':
      message.error({ content: err.message ?? '网络有点卡，请重试' });
      break;
    case 'FATAL':
      Modal.error({ title: '支付失败', content: err.message });
      break;
    case 'UNKNOWN':
      message.error(err.desc ?? '系统异常');
      break;
  }
}
