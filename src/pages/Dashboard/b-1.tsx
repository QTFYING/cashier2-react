import { useStore } from './zustand/store';

export function B1() {
  const b1 = useStore((state) => state.b1);
  const setB1 = useStore((state) => state.setB1);

  console.log('B1 render...');

  return (
    <div>
      b1: {b1}
      <button onClick={() => setB1(b1 + 1)}>加一</button>
    </div>
  );
}
