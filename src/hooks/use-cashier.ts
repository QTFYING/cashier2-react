import { useContext } from 'react';
import { PaymentContext } from '../cashier2';
import { CashierContext } from './cashier-context';

export const useCashier = (): PaymentContext => {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error('useCashier must be used within a CashierProvider');
  }
  return context.cashier;
};
