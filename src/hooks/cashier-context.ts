import { createContext } from 'react';
import { PaymentContext } from '../cashier2';

export const CashierContext = createContext<{ cashier: PaymentContext } | null>(null);
