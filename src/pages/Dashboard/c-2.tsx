import { useAtom } from 'jotai';
import { c2Atom } from './jotai/store';

export function C2() {
  const [c2, setC2] = useAtom(c2Atom);

  console.log('C2 render...');

  return (
    <div>
      c2: {c2}
      <button onClick={() => setC2(c2 + 1)}>加一</button>
    </div>
  );
}
