import { useSyncExternalStore } from 'react';

type Atom<T> = {
  value: T;
  subscribers: Set<() => void>;
};

export function tinyAtom<T>(initialValue: T): Atom<T> {
  return {
    value: initialValue,
    subscribers: new Set(),
  };
}

function setAtomValue<T>(a: Atom<T>, next: T | ((prev: T) => T)) {
  a.value = typeof next === 'function' ? (next as (prev: T) => T)(a.value) : next;
  a.subscribers.forEach((cb) => cb());
}

export function useMyAtom<T>(a: Atom<T>): [T, (v: T | ((prev: T) => T)) => void] {
  const subscribe = (callback: () => void) => {
    a.subscribers.add(callback);
    return () => a.subscribers.delete(callback);
  };

  const getSnapshot = () => a.value;

  const setValue = (next: T | ((prev: T) => T)) => {
    setAtomValue(a, next);
  };

  const value = useSyncExternalStore(subscribe, getSnapshot);

  return [value, setValue];
}
