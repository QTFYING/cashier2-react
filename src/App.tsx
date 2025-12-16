import React from 'react';
import { RouterProvider } from 'react-router-dom';
import service from './api/request';
import { CashierProvider } from './hooks/cashier-provider';
import router from './router';

const App: React.FC = () => {
  return (
    <CashierProvider config={{ debug: true, http: service, invokerType: 'web' }}>
      <RouterProvider router={router} />
    </CashierProvider>
  );
};

export default App;
