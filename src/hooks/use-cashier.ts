import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PayParams, PayResult } from '../cashier2';
import { CashierContext } from './cashier-context';
import { PaymentStatusEnum } from './enums';

import type { CashierState, UseCashierOptions } from './types';

export function useCashier(options: UseCashierOptions = {}) {
  const context = useContext(CashierContext);

  // 1. 安全性优化：确保 Context 存在
  if (!context) {
    throw new Error('useCashier must be used within a CashierProvider');
  }

  const { cashier } = context;

  // --- 状态管理 ---
  const [state, setState] = useState<CashierState>({ loading: false, status: 'idle', result: null, error: null });

  // 使用 Ref 保存回调，防止 useEffect 依赖频繁变化导致重复绑定事件
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // --- 1. 事件监听 (EventBus 桥接) ---
  useEffect(() => {
    if (!cashier) return;

    // 2. 优化：提取处理函数，以便正确解绑 (off)
    const handleSuccess = (res: PayResult) => {
      setState((s) => ({ ...s, loading: false, status: 'success', result: res }));
      optionsRef.current.onSuccess?.(res);
    };

    const handleFail = (err: any) => {
      setState((s) => ({ ...s, loading: false, status: 'fail', error: err }));
      optionsRef.current.onError?.(err);
    };

    const handleStatusChange = (payload: { status: string; result?: any }) => {
      // 这里的 status 可能是 'pending' (轮询中)
      optionsRef.current.onStatusChange?.(payload.status, payload.result);
      if (payload.status === 'pending') {
        setState((s) => ({ ...s, status: 'processing' }));
      }
    };

    // 绑定事件
    cashier.on('success', handleSuccess);
    cashier.on('fail', handleFail);
    cashier.on('statusChange', handleStatusChange);

    // 3. 优化：移除 hook 内的插件注册
    // 插件注册是全局副作用，应该在 App 启动或 Provider 中完成，而不是每次 hook 挂载都重复注册
    // cashier.use(LoggerPlugin).use(LoadingPlugin).use(AuthPlugin);

    // 4. 优化：清理时仅移除当前 hook 的监听器，而不是清空所有 (cashier.clear() 是破坏性的)
    return () => {
      cashier.off('success', handleSuccess);
      cashier.off('fail', handleFail);
      cashier.off('statusChange', handleStatusChange);
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

  return { ...state, pay, refund, cashier, calculatePrice, statusText: PaymentStatusEnum[state.status] };
}
