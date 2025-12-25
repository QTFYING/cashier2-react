import { create } from 'zustand';
import type { Store } from './types';

export const useStore = create<Store>((set) => ({
  b1: 0,
  b2: 0,
  setB1: (value: number) => set({ b1: value }),
  setB2: (value: number) => set({ b2: value }),
}));
