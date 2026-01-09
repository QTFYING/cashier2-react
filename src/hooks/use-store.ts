import { useSyncExternalStore } from 'react';
import type { CashierState } from './types';

export const useStore = (store: any): CashierState => {
  return useSyncExternalStore(store.subscribe.bind(store), store.getState.bind(store));
};
