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
  // 保持聚合状态，方便统一重置
  const [state, setState] = useState<CashierState>({ loading: false, status: null, result: null, error: null, action: null });

  // Ref 保持引用，避免 useEffect 依赖地狱
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // --- 1. 事件监听 (负责处理 异步/被动 更新) ---
  // 场景：轮询查单成功、用户扫码成功、超时自动关闭
  useEffect(() => {
    if (!cashier) return;

    const handleSuccess = (res: PayResult) => {
      setState((s) => ({ ...s, loading: false, status: 'success', result: res, action: null }));
      options?.onSuccess?.(res);
      cashier.stopPolling();
    };

    const handleFail = (err: any) => {
      setState((s) => ({ ...s, loading: false, status: 'fail', error: err, action: null }));
      options?.onError?.(err);
    };

    const handleStatusChange = (payload: { status: string; result?: any }) => {
      // 这里的 status 可能是 'pending' (轮询中)
      options?.onStatusChange?.(payload.status, payload.result);

      // 如果轮询过程中状态变了，更新一下 UI (比如显示"已扫码，等待确认")
      setState((s) => ({ ...s, status: payload.status as any }));
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
      // 1. 重置状态
      setState((s) => ({ ...s, loading: true, error: null, status: 'processing', action: null, result: null }));

      try {
        // 2. 执行 SDK
        // 注意：这里的 res 包含了即时结果 (比如 pending + qrcode)
        const res = await cashier.execute(strategyName, params);

        // 3. 关键: 立即根据返回值更新状态
        // 不要等待 EventBus，因为如果是扫码模式，EventBus此时可能不会触发任何事件
        // 如果是 pending (扫码/跳转)，loading 应该结束，让用户去操作
        // 如果是 success (免密扣款)，loading 也结束
        setState((s) => ({ ...s, loading: false, status: res.status, result: res, action: res.action || null }));

        return res;
      } catch (err: any) {
        // 错误已经在 handleFail 里处理过状态了，这里主要是为了让 await pay() 的调用者能 catch 到
        // 为了防止状态没更新 (比如 error 在 EventBus 触发前就抛出了)，这里兜底设一次
        setState((s) => ({ ...s, loading: false, error: err, status: 'fail' }));
        throw err; // 继续抛出，让 UI 层处理
      }
    },
    [cashier],
  );

  // --- 3. reset 状态 ---
  const reset = () => {
    setState({ loading: false, status: null, result: null, error: null, action: null });
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
