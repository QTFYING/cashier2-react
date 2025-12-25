import { useContext } from 'react';
import { context } from './context/context';

export const A2 = () => {
  const { a2, setA2 } = useContext(context);

  console.log('A2 render...');

  return (
    <div>
      a2: {a2}
      <button onClick={() => setA2(a2 + 1)}>加一</button>
    </div>
  );
};
