import { useStore } from './zustand/store';

export function B2() {
  const b2 = useStore((state) => state.b2);
  const setB2 = useStore((state) => state.setB2);

  console.log('B2 render...');

  return (
    <div>
      b2: {b2}
      <button onClick={() => setB2(b2 + 1)}>加一</button>
    </div>
  );
}
