import { atom } from 'jotai';
import { getListById } from '../utils/list';

export const c1Atom = atom(0);
export const c2Atom = atom(0);

export const listAtom = atom<string[]>([]);

export const dataAtom = atom(
  (get) => get(listAtom),
  async (_get, set, id: number) => {
    const data = await getListById(id);
    set(listAtom, data);
  },
);
