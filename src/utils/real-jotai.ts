import { createContext, createElement, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';

// 1. Atom 定义：不再是容器，只是一个“配置对象”或“键”
export type Atom<T> = {
  init: T;
};

export function atom<T>(initialValue: T): Atom<T> {
  return { init: initialValue };
}

// 2. Store 核心：真正存数据的地方
// 使用 WeakMap，这样 Atom 对象销毁时，对应的数据也会自动被 GC
export type Store = {
  get: <T>(atom: Atom<T>) => T;
  set: <T>(atom: Atom<T>, value: T) => void;
  sub: (atom: Atom<any>, callback: () => void) => () => void;
};

export function createStore(): Store {
  const values = new WeakMap<Atom<any>, any>();
  const listeners = new WeakMap<Atom<any>, Set<() => void>>();

  const get = <T>(atom: Atom<T>): T => {
    return values.has(atom) ? values.get(atom) : atom.init;
  };

  const set = <T>(atom: Atom<T>, nextValue: T) => {
    const prevValue = get(atom);
    if (Object.is(prevValue, nextValue)) return;

    values.set(atom, nextValue);

    const atomListeners = listeners.get(atom);
    if (atomListeners) {
      atomListeners.forEach((cb) => cb());
    }
  };

  const sub = (atom: Atom<any>, callback: () => void) => {
    if (!listeners.has(atom)) {
      listeners.set(atom, new Set());
    }
    const atomListeners = listeners.get(atom)!;
    atomListeners.add(callback);
    return () => atomListeners.delete(callback);
  };

  return { get, set, sub };
}

// 3. React 集成：通过 Context 下发 Store
const StoreContext = createContext<Store | null>(null);

// [NEW] 默认的全局 Store (Provider-less mode)
const defaultStore = createStore();

export function MyJotaiProvider({ children, store }: { children: ReactNode; store?: Store }) {
  const [selfStore] = useState(() => createStore());
  return createElement(StoreContext.Provider, { value: store || selfStore }, children);
}

// 4. Hook：连接 React 和 Store
export function useAtom<T>(atom: Atom<T>): [T, (val: T) => void] {
  const contextStore = useContext(StoreContext);
  // 如果没有 Provider，就用默认的全局 Store
  const store = contextStore || defaultStore;

  // useSyncExternalStore 的核心用途：
  // 只订阅“这个 atom”的变化，而不是整个 store
  const subscribe = (callback: () => void) => {
    return store.sub(atom, callback);
  };

  const getSnapshot = () => {
    return store.get(atom);
  };

  const value = useSyncExternalStore(subscribe, getSnapshot);

  return [value, (v: T) => store.set(atom, v)];
}
