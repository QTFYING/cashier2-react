import { InvokerFactory } from '@my-cashier/core';
import { TiktokInvoker } from './tiktok-invoker';
import { WebInvoker } from './web-invoker'; // Import from local

declare const tt: any;

const judgingEnv = () => typeof tt !== 'undefined' && typeof tt.pay === 'function';

// Register Custom Invokers
InvokerFactory.register('tiktok', TiktokInvoker, judgingEnv, 60);

// Register Default Web Invoker (Fallback)
InvokerFactory.register('web', WebInvoker as any, () => typeof window !== 'undefined', 10);
