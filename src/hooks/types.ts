import type { PayError, PaymentAction, PaymentPlugin, PayParams, PayResult } from '@my-cashier/core';
import { PaymentStatusEnum } from './enums';

// --- 入参配置 ---
export interface UseCashierOptions {
  // 1. 自动注册的插件 (可选)
  // 场景：进入这个页面时，自动挂载一个"倒计时插件"或"页面级埋点插件"
  plugins?: PaymentPlugin[];

  // 2. 事件回调 (EventBridge)
  onSuccess?: (result: PayResult) => void;
  onError?: (error: PayError) => void;
  onStatusChange?: (status: string, result?: PayResult) => void; // 比如监听轮询状态

  // 3. 初始倒计时 (秒)
  autoCountDown?: number;
}

// --- 出参接口 ---
export interface CashierActions {
  // 核心动作
  pay: (strategyName: string, params: PayParams) => Promise<PayResult>;
  refund: (orderId: string, amount: number) => Promise<any>; // 退款

  // 辅助动作
  calculatePrice: (original: number, coupons: any[]) => number; // 计算最终价
  registerPlugin: (plugin: PaymentPlugin) => void; // 动态注册
}

export interface CashierState {
  loading: boolean;
  status: keyof typeof PaymentStatusEnum | null;
  result: PayResult | null;
  error: PayError | null;
  action: PaymentAction | null;
}
