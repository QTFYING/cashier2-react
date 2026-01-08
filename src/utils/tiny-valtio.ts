// 1. 存储 [Proxy对象] -> [Listeners集合] 的映射
const listenersMap = new WeakMap<object, Set<() => void>>();

// 这是一个简化的 proxy 实现
export function proxy<T extends object>(initialObject: T): T {
  // 定义拦截器
  const p = new Proxy(initialObject, {
    get(target, prop, receiver) {
      // 普通读取
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      // 1. 检查值是否真的变了
      const prevValue = Reflect.get(target, prop, receiver);
      if (Object.is(prevValue, value)) {
        return true;
      }

      // 2. 写入新值
      const result = Reflect.set(target, prop, value, receiver);

      // 3. 通知所有监听者
      notifyUpdate(p);

      return result;
    },
  });

  // 初始化监听器集合
  listenersMap.set(p, new Set());

  return p as T;
}

// 辅助函数：触发通知
function notifyUpdate(proxyObject: object) {
  const listeners = listenersMap.get(proxyObject);
  if (listeners) {
    listeners.forEach((cb) => cb());
  }
}

// 辅助函数：订阅 (React 会用到)
export function subscribe(proxyObject: object, callback: () => void) {
  const listeners = listenersMap.get(proxyObject);
  if (listeners) {
    listeners.add(callback);
    // 返回 unsubscribe 函数
    return () => listeners.delete(callback);
  }
  return () => {};
}
