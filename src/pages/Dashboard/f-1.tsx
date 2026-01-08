import { Button, Space, Typography } from 'antd';
import { proxy, useSnapshot } from 'valtio';

const { Title } = Typography;

// 1. 定义状态：就是一个纯粹的 JS 对象
// 没有 createStore，没有 atom，没有 provider
const state = proxy({
  user: {
    name: 'Virgo',
    age: 18,
    profile: {
      bio: 'Frontend Architect',
      skills: ['React', 'TypeScript'],
    },
  },
  count: 0,
});

// 2. 在组件外修改状态（Action 都不需要定义）
// 你可以在任何地方直接改，甚至在 console 里
// (为了演示方便，这里把函数挂在 window 上方便你在控制台调用)
const inc = () => {
  state.count++;
};

export default function F1() {
  const snap = useSnapshot(state);
  console.log('Rendering [Counter] (depends on count)');

  return (
    <div>
      <Space>
        <Title level={4} style={{ margin: 0 }}>
          {snap.count}
        </Title>

        <Button type="primary" onClick={inc}>
          Count++
        </Button>
      </Space>
    </div>
  );
}
