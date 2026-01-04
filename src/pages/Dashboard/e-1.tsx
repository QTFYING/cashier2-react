import { Button, Space } from 'antd';
import { tinyAtom, useMyAtom } from '../../utils/tiny-jotai';

const countAtom = tinyAtom(0);

export function E1() {
  console.log('E1 render...');

  const [count, setCount] = useMyAtom(countAtom);

  return (
    <div>
      <div>count: {count}</div>

      <Space>
        <Button type="primary" onClick={() => setCount((c) => c + 1)}>
          加 1
        </Button>
        <Button type="primary" onClick={() => setCount((c) => c + 10)}>
          加 10
        </Button>
      </Space>
    </div>
  );
}
