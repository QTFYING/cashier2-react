import { useEffect, useState } from 'react';

export function useSyncExternalStore(subscribe: (listener: () => void) => void, getSnapshot: () => any) {
  const [state, setState] = useState(getSnapshot());

  useEffect(() => {
    const handleStoreChange = () => {
      setState(getSnapshot());
    };

    // 1. 订阅状态变化（返回清理函数）
    const unsubscribe = subscribe(handleStoreChange);

    // 2. 返回清理函数（组件卸载时执行）
    return unsubscribe;
  }, [subscribe, getSnapshot]);

  return state;
}
