import { Card } from 'antd';
import { A1 } from './a-1';
import { A2 } from './a-2';
import { B1 } from './b-1';
import { B2 } from './b-2';
import { C1 } from './c-1';
import { C2 } from './c-2';
import { C3 } from './c-3';
import { Provider } from './context/provider';
import { D1 } from './d-1';
import { D2 } from './d-2';

const Dashboard = () => {
  return (
    <div>
      <h2 className="mb-6">Dashboard</h2>

      <Provider>
        <Card title="Context" className="mt-6">
          <A1 />
          <A2 />
        </Card>
      </Provider>

      <Card title="Zustand" className="mt-6">
        <B1 />
        <B2 />
      </Card>

      <Card title="Jotai" className="mt-6">
        <C1 />
        <C2 />
        <C3 />
      </Card>

      <Card title="Tiny-Zustand" className="mt-6">
        <D1 />
        <D2 />
      </Card>
    </div>
  );
};

export default Dashboard;
