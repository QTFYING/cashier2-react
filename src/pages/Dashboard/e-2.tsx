import { Button, Divider, Space } from 'antd';
import { atom, MyJotaiProvider, useAtom } from '../../utils/real-jotai';

// 1. 定义 Atom (只是定义了初始配置，还没存值)
const countAtom = atom(0);
const textAtom = atom('hello');

// 2. 子组件：使用 Atom
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  console.log('Counter render', count);
  return <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>;
}

function TextInput() {
  const [text, setText] = useAtom(textAtom);
  console.log('TextInput render', text);
  return (
    <Space>
      <span>Text: {text}</span>
      <Button onClick={() => setText(Math.random().toString().slice(0, 5))}>Change Text</Button>
    </Space>
  );
}

// 3. 顶层：必须包裹 Provider
export default function RealJotaiDemo() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Real Jotai Architecture (Context + WeakMap)</h2>

      {/* 0. Provider-less Mode (Default Store) */}
      <div style={{ marginBottom: 20, padding: 10, border: '1px dashed #666' }}>
        <h3>Provider-less Mode (Global Default Store)</h3>
        <p>This mimics standard Jotai usage where you don't need a Provider.</p>
        <Counter />
        <Divider />
        <TextInput />
      </div>

      {/* 两个 Provider 隔离测试 */}
      <div style={{ display: 'flex', gap: 40 }}>
        {/* App Instance 1 */}
        <MyJotaiProvider>
          <div style={{ border: '1px solid #ccc', padding: 10 }}>
            <h3>App Instance 1</h3>
            <Counter />
            <Divider />
            <TextInput />
          </div>
        </MyJotaiProvider>

        {/* App Instance 2: 应该和 Instance 1 状态隔离 */}
        <MyJotaiProvider>
          <div style={{ border: '1px solid #ccc', padding: 10 }}>
            <h3>App Instance 2 (Isolated)</h3>
            <Counter />
            <Divider />
            <TextInput />
          </div>
        </MyJotaiProvider>
      </div>
    </div>
  );
}
