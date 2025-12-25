import { useAtom } from 'jotai';
import { c1Atom } from './jotai/store';

export function C1() {
  const [c1, setC1] = useAtom(c1Atom);

  console.log('C1 render...');

  return (
    <div>
      c1: {c1}
      <button onClick={() => setC1(c1 + 1)}>加一</button>
    </div>
  );
}
