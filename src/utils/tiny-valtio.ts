import { useSyncExternalStore } from 'react';

// 1. 存储 [Proxy对象] -> [Listeners集合]
const listenersMap = new WeakMap<object, Set<() => void>>();

// 2. 存储 [Proxy对象] -> [版本号]
const versionMap = new WeakMap<object, number>();

// 3. 存储 [Proxy对象] -> [Snapshot缓存]
const snapshotCache = new WeakMap<object, { version: number; snap: any }>();

function isObject(x: unknown): x is object {
  return typeof x === 'object' && x !== null;
}

export function proxy<T extends object>(initialObject: T): T {
  // 如果已经是 proxy 了，直接返回（防止重复代理）
  if (versionMap.has(initialObject)) {
    return initialObject;
  }

  // ✨ 递归：遍历初始对象的属性，把它们也变成 proxy
  for (const key in initialObject) {
    const val = initialObject[key];
    if (isObject(val)) {
      initialObject[key] = proxy(val) as any;
    }
  }

  let version = 0;

  const p = new Proxy(initialObject, {
    get(target, prop, receiver) {
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      const prevValue = Reflect.get(target, prop, receiver);
      if (Object.is(prevValue, value)) {
        return true;
      }

      // ✨ 递归：如果你 set 进来一个新对象，也要把它变成 proxy
      // 否则 state.user = { name: 'New' } 这样赋值后，新 user 就不响应了
      const nextValue = isObject(value) ? proxy(value) : value;

      const result = Reflect.set(target, prop, nextValue, receiver);

      // 更新版本号并通知
      version++;
      versionMap.set(p, version);
      notifyUpdate(p);

      return result;
    },
  });

  listenersMap.set(p, new Set());
  versionMap.set(p, version);

  return p as T;
}

function notifyUpdate(proxyObject: object) {
  const listeners = listenersMap.get(proxyObject);
  if (listeners) {
    listeners.forEach((cb) => cb());
  }
}

export function subscribe(proxyObject: object, callback: () => void) {
  const listeners = listenersMap.get(proxyObject);
  if (listeners) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }
  return () => {};
}

export function snapshot<T extends object>(proxyObject: T): T {
  const currentVersion = versionMap.get(proxyObject) || 0;
  const cache = snapshotCache.get(proxyObject);

  if (cache && cache.version === currentVersion) {
    return cache.snap;
  }

  // ✨ 递归：不仅浅拷贝，还要把子 proxy 也转成 snapshot
  const snap: any = Array.isArray(proxyObject) ? [] : {};

  Reflect.ownKeys(proxyObject).forEach((key) => {
    const value = (proxyObject as any)[key];

    // 如果属性值是对象（即子 proxy），递归取它的 snapshot
    if (isObject(value)) {
      snap[key] = snapshot(value);
    } else {
      snap[key] = value;
    }
  });

  Object.freeze(snap);

  snapshotCache.set(proxyObject, { version: currentVersion, snap });

  return snap as T;
}

export function useSnapshot<T extends object>(proxyObject: T): T {
  const subscribeToProxy = (callback: () => void) => subscribe(proxyObject, callback);
  const getSnapshot = () => snapshot(proxyObject);

  return useSyncExternalStore(subscribeToProxy, getSnapshot, getSnapshot);
}
