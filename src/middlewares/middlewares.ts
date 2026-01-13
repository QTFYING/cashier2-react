import { produce } from 'immer';
import type { Middleware } from '../utils';

// 1. 日志中间件: 在每次 setState 前后打印
export function loggerMiddleware<S extends object>(): Middleware<S> {
  return (next) => (set, get, api) => {
    // 包装 set，使其在调用前后打印
    const wrappedSet: typeof set = (partial) => {
      console.log('[logger] before set, prev:', get());
      const res = set(partial);
      console.log('[logger] after set, next:', get());
      return res;
    };
    return next(wrappedSet, get, api);
  };
}

// 2. 持久化中间件: 把 state 写入 localStorage（简单示例）
export function persistMiddleware<S extends object>(key: string): Middleware<S> {
  return (next) => (set, get, api) => {
    // 在初始化时尝试从 localStorage 恢复
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<S>;
        // 先把恢复的片段合并到初始 state（通过调用 set）
        set((prev: S) => ({ ...prev, ...parsed }) as S);
      }
    } catch (e) {
      console.warn('[persist] restore failed', e);
    }

    // 包装 set：在每次写后持久化
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

// immer 中间件：允许在 set 中传入 producer（draft => void）
export function immerMiddleware<S extends object>(): Middleware<S> {
  return (next) => (set, get, api) => {
    const wrappedSet: typeof set = (partial) => {
      if (typeof partial === 'function') {
        // 如果传入的是函数，使用 immer 的 produce
        const updater = partial as (prev: S) => S;
        const res = set((prev: S) =>
          produce(prev, (draft: any) => {
            // 调用用户的 updater 以便在 draft 上修改
            const maybe = updater(draft as unknown as S);
            // 如果 updater 返回了新对象（非 undefined），优先使用它
            if (maybe !== undefined) return maybe as unknown as S;
            // 否则，immer 会返回 draft 的拷贝
          }),
        );
        return res;
      }
      return set(partial);
    };
    return next(wrappedSet, get, api);
  };
}
