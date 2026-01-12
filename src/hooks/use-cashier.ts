import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PayParams, PayResult } from '@my-cashier/core';
import { CashierContext } from './cashier-context';
import { PaymentStatusEnum } from './enums';
import type { UseCashierOptions } from './types';
import { useStore } from './use-store';

export function useCashier(options: UseCashierOptions = {}) {
  const context = useContext(CashierContext);
  const [orderId, setOrderId] = useState('');

  if (!context) {
    throw new Error('useCashier must be used within a CashierProvider');
  }

  const { cashier } = context;

  // Ref 保持引用，避免 useEffect 依赖地狱
  const optionsRef = useRef(options);

  // --- 1. 订阅 Store 更新 ---
  // 使用封装好的 hook，让代码看起来更“傻瓜式”
  const storeState = useStore(cashier.store);

  const isProcess = storeState.status === 'processing' || storeState.status === 'pending';

  const state = {
    loading: storeState.loading || isProcess,
    status: storeState.status || null,
    result: storeState.result || null,
    error: (storeState.error as any) || null,
    action: storeState.result?.action || null,
  };

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!cashier) return;

    const handleSuccess = (res: PayResult) => optionsRef.current?.onSuccess?.(res);
    const handleFail = (err: any) => optionsRef.current?.onError?.(err);
    const handleStatusChange = (payload: { status: string; result?: any }) => {
      optionsRef.current?.onStatusChange?.(payload.status, payload.result);
    };

    cashier.on('success', handleSuccess);
    cashier.on('fail', handleFail);
    cashier.on('statusChange', handleStatusChange);

    return () => {
      cashier.off('success', handleSuccess);
      cashier.off('fail', handleFail);
      cashier.off('statusChange', handleStatusChange);
    };
  }, [cashier]);

  // --- 2. 核心支付动作 (负责处理 同步/主动 反馈) ---
  // 场景：点击支付按钮 -> loading -> 拿到二维码/跳转链接
  const pay = useCallback(
    async (strategyName: string, params: PayParams) => {
      // 执行 SDK
      // 注意：这里的 res 包含了即时结果 (比如 pending + qrcode)
      return await cashier.execute(strategyName, params);
    },
    [cashier],
  );

  // --- 3. reset 状态 ---
  const reset = useCallback(() => {
    // 必须调用 store 的方法来重置，而不是本地 setState
    cashier.store.setState({ loading: false, status: 'idle', result: undefined, error: undefined });
  }, [cashier]);

  // --- 4. 上下游场景：退款 ---
  const refund = useCallback(() => {}, []);

  // --- 5. 上下游场景：创建订单 ---
  const create = useCallback(
    async (params: any) => {
      try {
        // 复用 Store 的 loading 状态
        cashier.store.setState({ loading: true });
        // 建议hooks中的http请求全部读取context中的http实例
        const { orderId } = await cashier.http.post('/payment/create', params);
        setOrderId(orderId);
        return orderId;
      } finally {
        cashier.store.setState({ loading: false });
      }
    },
    [cashier],
  );

  return {
    // 基础状态
    loading: state.loading,
    result: state.result,
    error: state.error,
    status: state.status,
    statusText: state.status ? PaymentStatusEnum[state.status] : '',

    // 订单相关信息
    orderId,

    // 方法
    pay,
    reset,
    refund,
    create,

    // 实例
    cashier,
  };
}
