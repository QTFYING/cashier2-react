import { ConfigProvider } from 'antd';
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import './App.css';
import router from './router';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
};

export default App;
