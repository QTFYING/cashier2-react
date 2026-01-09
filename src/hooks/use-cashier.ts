import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PayParams, PayResult } from '../cashier2';
import { CashierContext } from './cashier-context';
import { PaymentStatusEnum } from './enums';
import type { CashierState, UseCashierOptions } from './types';

export function useCashier(options: UseCashierOptions = {}) {
  const context = useContext(CashierContext);
  const [orderId, setOrderId] = useState('');

  if (!context) {
    throw new Error('useCashier must be used within a CashierProvider');
  }

  const { cashier } = context;

  // --- 状态管理 ---
  // 使用 Store 同步状态
  const [state, setState] = useState<CashierState>(() => {
    const s = cashier.store.getState();
    return {
      loading: s.loading,
      status: s.status === 'idle' ? null : s.status,
      result: s.result || null,
      error: (s.error as any) || null,
      action: s.result?.action || null,
    };
  });

  // Ref 保持引用，避免 useEffect 依赖地狱
  const optionsRef = useRef(options);

  // --- 1. 订阅 Store 更新 + 事件监听 ---
  // 场景：轮询查单成功、用户扫码成功、超时自动关闭
  useEffect(() => {
    if (!cashier) return;
    optionsRef.current = options;

    // A. 订阅 Store (Subject Pattern)
    // 只要 Store 变了，这里就会收到通知，无论是因为轮询还是主动 execute
    const unsubscribe = cashier.store.subscribe((s) => {
      setState(() => {
        return {
          loading: s.loading,
          status: s.status === 'idle' ? null : s.status,
          result: s.result || null,
          error: (s.error as any) || null,
          action: s.result?.action || null,
        };
      });
    });

    // B. 事件监听 (仅用于触发 options 回调，不再负责 UI 更新)
    const handleSuccess = (res: PayResult) => {
      optionsRef.current?.onSuccess?.(res);
    };

    const handleFail = (err: any) => {
      optionsRef.current?.onError?.(err);
    };

    const handleStatusChange = (payload: { status: string; result?: any }) => {
      optionsRef.current?.onStatusChange?.(payload.status, payload.result);
    };

    cashier.on('success', handleSuccess);
    cashier.on('fail', handleFail);
    cashier.on('statusChange', handleStatusChange);

    return () => {
      unsubscribe();
      cashier.off('success', handleSuccess);
      cashier.off('fail', handleFail);
      cashier.off('statusChange', handleStatusChange);
    };
  }, [cashier, options]);

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
  const reset = () => {
    // 必须调用 store 的方法来重置，而不是本地 setState
    cashier.store.setState({ loading: false, status: 'idle', result: undefined, error: undefined });
  };

  // --- 4. 上下游场景：退款 ---
  const refund = useCallback(() => {}, []);

  // --- 5. 上下游场景：创建订单 ---
  const create = async (params: any) => {
    // 建议hooks中的http请求全部读取context中的http实例
    const { orderId } = await cashier.http.post('/payment/create', params);
    setOrderId(orderId);
    return orderId;
  };

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
