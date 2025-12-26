import { create } from '../../../utils';

type MyState = {
  count: number;
  text: string;
  inc: () => void;
  setText: (t: string) => void;
};

export const useMyStore = create<MyState>((set, _get) => ({
  count: 0,
  text: 'hello',
  inc: () => set((s) => ({ ...s, count: s.count + 1 })),
  setText: (t: string) => set({ text: t }),
}));
