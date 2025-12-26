import { immerMiddleware, loggerMiddleware, persistMiddleware } from '../../../middlewares/middlewares';
import { create, createWithMiddleware, shallowEqual } from '../../../utils';

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

export const useZuStore = createWithMiddleware<MyState>(
  (set, _get) => ({
    count: 0,
    text: 'hello',
    inc: () => set((s) => ({ ...s, count: s.count + 1 })),
    setText: (t: string) => set({ text: t }),
  }),
  [loggerMiddleware(), persistMiddleware('my-store-key'), immerMiddleware()],
);

// 订阅某个 selector 的变化
(useMyStore as any).subscribeWithSelector(
  (s) => ({ count: s.count + 1, text: s.text }),
  () => {
    console.log('count 或 text 变化了');
  },
  shallowEqual,
);

export { shallowEqual };
