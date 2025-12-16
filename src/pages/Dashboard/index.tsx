import { DollarCircleOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic } from 'antd';
import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div>
      <h2 className="mb-6">Dashboard</h2>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="Total Transactions" value={112893} prefix={<DollarCircleOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Daily Orders" value={1234} prefix={<ShoppingCartOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Active Users" value={93} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Activity" className="mt-6">
        <p>System operational.</p>
        <p>Payment gateway status: Online</p>
      </Card>
    </div>
  );
};

export default Dashboard;
