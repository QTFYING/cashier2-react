import { createContext } from 'react';
import { PaymentContext } from '@my-cashier/core';

export const CashierContext = createContext<{ cashier: PaymentContext } | null>(null);
