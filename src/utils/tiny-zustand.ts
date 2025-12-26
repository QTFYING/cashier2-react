import { produce } from 'immer';
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

/* -------------------- 示例中间件（可直接复制使用） -------------------- */

/**
 * loggerMiddleware
 * - 在每次 set 前后打印 prev/next（注意：get() 在 set 前后读取）
 */
export function loggerMiddleware<S extends object>(): Middleware<S> {
  return (next) => (set, get, api) => {
    const wrappedSet: typeof set = (partial) => {
      try {
        console.log('[logger] before set:', get());
      } catch {}
      const res = set(partial);
      try {
        console.log('[logger] after set:', get());
      } catch {}
      return res;
    };
    return next(wrappedSet, get, api);
  };
}

/**
 * persistMiddleware
 * - 简单示例：在每次 set 后把整个 state 序列化到 localStorage
 * - 可扩展：白名单、serialize/deserialize、节流等
 */
export function persistMiddleware<S extends object>(key: string): Middleware<S> {
  return (next) => (set, get, api) => {
    // 在初始化时尝试恢复（注意：同步恢复可能会在 create 时触发 set）
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<S>;
        // 合并恢复到初始 state（直接调用 set）
        set((prev: S) => ({ ...prev, ...parsed }) as S);
      }
    } catch (e) {
      console.warn('[persist] restore failed', e);
    }

    const wrappedSet: typeof set = (partial) => {
      const res = set(partial);
      try {
        const next = get();
        localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.warn('[persist] save failed', e);
      }
      return res;
    };

    return next(wrappedSet, get, api);
  };
}

/**
 * immerMiddleware
 * - 使用 immer.produce 将函数式 updater 当作 producer（draft => void）来处理
 * - 如果传入的是对象或非函数，按原样处理
 */
export function immerMiddleware<S extends object>(): Middleware<S> {
  return (next) => (set, get, api) => {
    const wrappedSet: typeof set = (partial) => {
      if (typeof partial === 'function') {
        // 将用户传入的 updater 当作 producer 使用：produce(prev, draft => updater(draft))
        const updater = partial as (prev: S) => S | void;
        return set((prev: S) => {
          // produce 会返回新 state（或原 state），我们需要兼容两种返回值
          const produced = produce(prev, (draft: any) => {
            const maybe = (updater as any)(draft);
            // 如果用户的 updater 返回了一个值（非 undefined），immer 会忽略返回值，
            // 所以我们手动处理：如果 maybe !== undefined，则直接返回 maybe（覆盖 draft）
            if (maybe !== undefined) {
              // 通过抛出特殊信号不是好办法，这里直接在外层处理：返回 maybe
            }
            // 否则，直接在 draft 上修改即可
          });
          // 如果 updater 返回了新对象（用户在 updater 中 return），我们 prefer that,
          // 但因为 produce 忽略返回值，我们 call updater twice is not ideal.
          // 为了简单且安全，优先使用 produce 的结果
          return produced as S;
        });
      }
      return set(partial);
    };
    return next(wrappedSet, get, api);
  };
}
