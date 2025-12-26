import { useSyncExternalStore } from 'react';

type StateUpdater<S> = Partial<S> | ((prev: S) => S);
type Subscriber = () => void;
type Unsubscribe = () => void;

export type StoreApi<S> = {
  setState: (partial: StateUpdater<S>) => void;
  getState: () => S;
  subscribe: (listener: Subscriber) => Unsubscribe;
};

export type StateCreator<S> = (set: StoreApi<S>['setState'], get: StoreApi<S>['getState'], api: StoreApi<S>) => S | void;

/**
 * 简单浅比较（用于对象字段的浅比较）
 */
export function shallowEqual(a: any, b: any) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (let i = 0; i < ka.length; i++) {
    const key = ka[i];
    if (!Object.prototype.hasOwnProperty.call(b, key) || !Object.is(a[key], b[key])) return false;
  }
  return true;
}

/**
 * create: 返回一个 useStore Hook，同时把 store API 挂到这个 Hook 上（与 zustand 风格一致）
 */
export function create<S extends object>(stateCreator: StateCreator<S>) {
  let state = {} as S;
  const listeners = new Set<Subscriber>();

  const setState = (partial: StateUpdater<S>) => {
    const next = typeof partial === 'function' ? (partial as (prev: S) => S)(state) : { ...state, ...partial };
    if (next === state) return;
    state = next;
    // 通知所有订阅者
    listeners.forEach((l) => l());
  };

  const getState = () => state;

  const subscribe = (listener: Subscriber): Unsubscribe => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const api: StoreApi<S> = { setState, getState, subscribe };

  // 初始化 state（stateCreator 可以返回初始 state）
  const initial = stateCreator(setState, getState, api);
  if (initial && typeof initial === 'object') {
    state = { ...state, ...initial } as S;
  }

  /**
   * subscribeSelector: 支持 selector + equality 的订阅包装
   * 当底层 state 变化时，只有 selector(getState()) 的结果发生变化才触发 listener
   */
  const subscribeSelector = <T>(selector: (s: S) => T, listener: Subscriber, equality: (a: T, b: T) => boolean = Object.is): Unsubscribe => {
    let prev = selector(state);
    return subscribe(() => {
      const next = selector(state);
      if (!equality(prev, next)) {
        prev = next;
        listener();
      }
    });
  };

  /**
   * useStore Hook
   * - selector: 选择器，默认返回整个 state
   * - equality: 比较函数，默认严格相等（Object.is），常用 shallowEqual
   */
  function useStore<T = S>(selector: (s: S) => T = ((s: S) => s) as any, equality: (a: T, b: T) => boolean = Object.is) {
    const getSnapshot = () => selector(getState());
    const subscribeSnapshot = (cb: () => void) => subscribeSelector(selector, cb, equality);
    return useSyncExternalStore(subscribeSnapshot, getSnapshot, getSnapshot);
  }

  // 把 api 挂到 useStore 上，方便外部直接调用 useStore.getState() 等
  Object.assign(useStore, api);

  return useStore as typeof useStore & StoreApi<S>;
}
