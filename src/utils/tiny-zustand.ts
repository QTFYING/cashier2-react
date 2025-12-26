import { useRef, useSyncExternalStore } from 'react';

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
 * 智能默认比较：先 Object.is，再对对象做 shallowEqual
 */
function defaultEquality<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    return shallowEqual(a, b);
  }
  return false;
}

/* -------------------- 中间件类型与工具 -------------------- */
export type Middleware<S extends object> = (next: StateCreator<S>) => StateCreator<S>;

export function applyMiddlewares<S extends object>(creator: StateCreator<S>, middlewares: Middleware<S>[]) {
  return middlewares.reduce((acc, mw) => mw(acc), creator);
}

/* -------------------- create 实现 -------------------- */
export function create<S extends object>(stateCreator: StateCreator<S>) {
  let state = {} as S;
  const listeners = new Set<Subscriber>();

  const setState = (partial: StateUpdater<S>) => {
    const next = typeof partial === 'function' ? (partial as (prev: S) => S)(state) : { ...state, ...partial };
    if (next === state) return;
    state = next;
    // 同步通知所有订阅者（与原始实现一致）
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
   * subscribeWithSelector（类型化导出）
   * - selector: 选择器
   * - listener: 当 selector 返回值变化时调用
   * - equality: 比较函数，默认使用 defaultEquality（Object.is 或 shallowEqual）
   */
  function subscribeWithSelector<T>(selector: (s: S) => T, listener: Subscriber, equality: (a: T, b: T) => boolean = defaultEquality): Unsubscribe {
    let prev: T;
    try {
      prev = selector(state);
    } catch {
      // selector 抛错时，先把 prev 设为 undefined，避免阻塞订阅注册
      prev = undefined as unknown as T;
    }

    return subscribe(() => {
      let next: T;
      try {
        next = selector(state);
      } catch {
        // selector 在通知阶段抛错，忽略这次通知
        return;
      }
      if (!equality(prev, next)) {
        prev = next;
        listener();
      }
    });
  }

  /**
   * useStore Hook
   * - selector: 选择器，默认返回整个 state
   * - equality: 比较函数，默认严格相等（Object.is），常用 shallowEqual
   *
   * 内部用 useRef 缓存上一次 snapshot，避免不必要的对象分配被 React 误判
   */
  function useStore<T = S>(selector: (s: S) => T = ((s: S) => s) as any, equality: (a: T, b: T) => boolean = defaultEquality) {
    const lastSnapshot = useRef<T>(undefined as unknown as T);
    const lastInit = useRef(false);

    const getSnapshot = () => {
      const nextState = getState();
      const nextSelected = selector(nextState);

      if (!lastInit.current) {
        lastSnapshot.current = nextSelected;
        lastInit.current = true;
        return nextSelected;
      }

      if (equality(lastSnapshot.current, nextSelected)) {
        return lastSnapshot.current;
      }

      lastSnapshot.current = nextSelected;
      return nextSelected;
    };

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  // 把 api 挂到 useStore 上，方便外部直接调用 useStore.getState() 等
  Object.assign(useStore, api);
  // 把 subscribeWithSelector 也挂到 hook 上，便于外部直接使用
  (useStore as any).subscribeWithSelector = subscribeWithSelector;

  return useStore as typeof useStore & StoreApi<S> & { subscribeWithSelector: typeof subscribeWithSelector };
}

/* -------------------- createWithMiddleware 辅助 -------------------- */
/**
 * createWithMiddleware: 把 middlewares 应用到 stateCreator，然后调用 create
 */
export function createWithMiddleware<S extends object>(stateCreator: StateCreator<S>, middlewares: Middleware<S>[]) {
  const composed = applyMiddlewares(stateCreator, middlewares);
  return create<S>(composed);
}
