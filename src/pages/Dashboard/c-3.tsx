import { useAtom } from 'jotai';
import { dataAtom } from './jotai/store';

export function C3() {
  const [list, setList] = useAtom(dataAtom);

  console.log('C3 render...');

  return (
    <div>
      请求列表：<button onClick={() => setList(2)}>点击</button>
      <ul>
        {list.map((item) => {
          return <li key={item}>{item}</li>;
        })}
      </ul>
    </div>
  );
}
