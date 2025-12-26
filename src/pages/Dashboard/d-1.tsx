import { Button, Space } from 'antd';
import { useMyStore } from './tiny-zu/store';

export function D1() {
  // 推荐：使用 selector 只订阅需要的片段
  const count = useMyStore((s) => s.count);
  const text = useMyStore((s) => s.text);

  console.log('D1 render...');

  return (
    <div>
      <div>count: {count}</div>
      <div>text: {text}</div>

      <Space>
        <Button type="primary" onClick={() => useMyStore.getState().inc()}>
          加 1
        </Button>
        <Button type="primary" onClick={() => useMyStore.setState((s) => ({ ...s, count: s.count + 10 }))}>
          加 10
        </Button>
      </Space>
    </div>
  );
}
