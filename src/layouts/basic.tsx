import { CreditCardOutlined, DashboardOutlined, HistoryOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const BasicLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const { colorBgContainer, borderRadiusLG } = theme.useToken().token;

  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/payment',
      icon: <CreditCardOutlined />,
      label: '收银台',
      onClick: () => navigate('/payment'),
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '日志',
      onClick: () => navigate('/history'),
    },
  ];

  const selectedKey = menuItems.find((item) => location.pathname.startsWith(item.key))?.key || '/dashboard';

  return (
    <Layout className="min-h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="h-8 m-4 bg-white/20 rounded text-white justify-center flex items-center">LOGO 后台管理平台</div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="p-0 flex items-center" style={{ background: colorBgContainer }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} className="text-[16px] w-16 h-16" />
          <h2 className="m-0">收银台</h2>
        </Header>
        <Content className="my-6 mx-4 p-6 min-h-[280px]" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default BasicLayout;
