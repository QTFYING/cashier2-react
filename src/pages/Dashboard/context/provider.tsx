import { type FC, type PropsWithChildren, useState } from 'react';
import { context } from './context';

export const Provider: FC<PropsWithChildren> = ({ children }) => {
  const [a1, setA1] = useState(0);
  const [a2, setA2] = useState(0);

  return (
    <context.Provider
      value={{
        a1,
        a2,
        setA1,
        setA2,
      }}
    >
      {children}
    </context.Provider>
  );
};
