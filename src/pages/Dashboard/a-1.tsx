import { useContext } from 'react';
import { context } from './context/context';

export const A1 = () => {
  const { a1, setA1 } = useContext(context);

  console.log('A1 render...');

  return (
    <div>
      A1: {a1}
      <button onClick={() => setA1(a1 + 1)}>加一</button>
    </div>
  );
};
