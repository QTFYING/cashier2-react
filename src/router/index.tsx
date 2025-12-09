import { createBrowserRouter, Navigate } from 'react-router-dom';
import BasicLayout from '../layouts/BasicLayout';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Payment from '../pages/Payment';
import TransactionHistory from '../pages/TransactionHistory';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <BasicLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'payment',
        element: <Payment />,
      },
      {
        path: 'history',
        element: <TransactionHistory />,
      },
    ],
  },
  {
    path: '*',
    element: <div>404 Not Found</div>,
  },
]);

export default router;
