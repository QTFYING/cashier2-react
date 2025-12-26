import { Button, Space } from 'antd';
import { shallowEqual, useMyStore } from './tiny-zu/store';

export function D1() {
  // 推荐：使用 selector 只订阅需要的片段
  const count = useMyStore((s) => s.count);
  const text = useMyStore((s) => s.text);

  // 推荐：当 selector 返回对象时，传入 shallowEqual 避免不必要重渲染
  const obj = useMyStore((s) => ({ count: s.count, text: s.text }), shallowEqual);

  console.log('D1 render...');

  return (
    <div>
      <div>
        obj.count: {obj.count} obj.text: {obj.text}
      </div>

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
