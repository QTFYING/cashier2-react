import { useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { PayParams, PayResult } from '../cashier2';
import { CashierContext } from './cashier-context';
import { PaymentStatusEnum } from './enums';
import type { UseCashierOptions } from './types';

export function useCashier(options: UseCashierOptions = {}) {
  const context = useContext(CashierContext);
  const [orderId, setOrderId] = useState('');

  if (!context) {
    throw new Error('useCashier must be used within a CashierProvider');
  }

  const { cashier } = context;

  // Ref 保持引用，避免 useEffect 依赖地狱
  const optionsRef = useRef(options);

  // --- 1. 订阅 Store 更新 Using useSyncExternalStore ---
  const subscribe = useCallback(
    (callback: () => void) => {
      // 适配: Store expect (state) => void, but generic subscriber expects () => void
      // We ignore the state arg because we just need to trigger a re-render
      return cashier.store.subscribe(() => callback());
    },
    [cashier],
  );

  const getSnapshot = useCallback(() => {
    return cashier.store.getState();
  }, [cashier]);

  // 使用 useSyncExternalStore 代替手动维护的 setState
  // 注意：需要 React 18+
  const storeState = useSyncExternalStore(subscribe, getSnapshot);

  // Computed/Derived State (在 render 中计算，保证总是由 snapshot 驱动)
  const isProcess = storeState.status === 'processing' || storeState.status === 'pending';

  const state = {
    // 统一 loading 状态：网络请求中 或 业务处理中
    loading: storeState.loading || isProcess,
    status: storeState.status === 'idle' ? null : storeState.status,
    result: storeState.result || null,
    error: (storeState.error as any) || null,
    action: storeState.result?.action || null,
  };

  // 事件监听仅需保持引用，不需要触发 render，所以可以简单处理或分离
  // 由于原逻辑中 options 回调是在 useEffect 中绑定的，我们可以保持这一部分，
  // 或者将其移到独立的 useEffect 中，仅负责 EventBus -> callback 的桥接
  useEffect(() => {
    optionsRef.current = options;
    if (!cashier) return;

    // 事件转发 (EventBus -> User Options)
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
