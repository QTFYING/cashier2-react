import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PayError, PaymentContext, PaymentPlugin, PayParams, PayResult } from '../cashier2';
import { CashierContext } from './cashier-context';
import { AuthPlugin, LoadingPlugin, LoggerPlugin } from './plugin';

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
  status: 'idle' | 'created' | 'processing' | 'success' | 'fail' | 'refunded';
  result: PayResult | null;
  error: PayError | null;
}

export function useCashier(options: UseCashierOptions = {}) {
  const { cashier } = useContext(CashierContext) ?? { cashier: {} as PaymentContext };

  // --- 状态管理 ---
  const [state, setState] = useState<CashierState>({ loading: false, status: 'idle', result: null, error: null });

  // 使用 Ref 保存回调，防止 useEffect 依赖频繁变化导致重复绑定事件
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // --- 1. 事件监听 (EventBus 桥接) ---
  useEffect(() => {
    if (!cashier) return;

    // 绑定
    cashier.on('success', (res: PayResult) => {
      setState((s) => ({ ...s, loading: false, status: 'success', result: res }));
      optionsRef.current.onSuccess?.(res);
    });

    cashier.on('fail', (err: any) => {
      setState((s) => ({ ...s, loading: false, status: 'fail', error: err }));
      optionsRef.current.onError?.(err);
    });

    cashier.on('statusChange', (payload: { status: string; result?: any }) => {
      // 这里的 status 可能是 'pending' (轮询中)
      optionsRef.current.onStatusChange?.(payload.status, payload.result);
      if (payload.status === 'pending') {
        setState((s) => ({ ...s, status: 'processing' }));
      }
    });

    // 自动注册页面级插件 (防重复)
    cashier.use(LoggerPlugin).use(LoadingPlugin).use(AuthPlugin);

    // 清理
    return () => {
      cashier.clear();
    };
  }, [cashier]);

  // --- 2. 核心支付动作 ---
  const pay = useCallback(
    async (strategyName: string, params: PayParams) => {
      setState((s) => ({ ...s, loading: true, error: null, status: 'processing' }));

      try {
        const res = await cashier.execute(strategyName, params);
        return res;
      } catch (err: any) {
        throw new Error(err.message || '支付失败');
      } finally {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [cashier],
  );

  // --- 3. 上下游场景：退款 ---
  const refund = useCallback(() => {}, []);

  // --- 4. 营销计算 (纯逻辑) ---
  const calculatePrice = useCallback(() => {}, []);

  return { ...state, pay, refund, cashier, calculatePrice };
}
