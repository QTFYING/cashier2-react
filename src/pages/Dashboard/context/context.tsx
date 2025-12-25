import { createContext } from 'react';

export interface ContextType {
  a1: number;
  a2: number;
  setA1: (a1: number) => void;
  setA2: (a2: number) => void;
}

export const context = createContext<ContextType>({
  a1: 0,
  a2: 0,
  setA1: () => {},
  setA2: () => {},
});
