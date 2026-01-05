import { useSyncExternalStore } from 'react';

function create(stateCreator) {
  let state = {};
  const listeners = new Set();

  const setState = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : { ...state, ...partial };
    if (next === state) return;
    state = next;
    listeners.forEach((fn) => fn());
  };

  const getState = () => state;
  const subscribe = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };

  const api = { setState, getState, subscribe };
  // 初始化 state
  const initial = stateCreator(setState, getState, api);
  if (initial) state = { ...state, ...initial };

  const useStore = (selector = (s) => s, equality = (a, b) => a === b) => {
    const getSnapshot = () => selector(getState());
    const subscribeSnapshot = (cb) => subscribe(cb);
    return useSyncExternalStore(subscribeSnapshot, getSnapshot, getSnapshot);
  };

  Object.assign(useStore, api);
  return useStore;
}

export default create;
