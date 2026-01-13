import { InvokerFactory } from '@my-cashier/core';
import { TiktokInvoker } from './tiktok-invoker';

declare const tt: any;

const judgingEnv = () => typeof tt !== 'undefined' && typeof tt.pay === 'function';

// Register Custom Invokers
InvokerFactory.register('tiktok', TiktokInvoker, judgingEnv, 60);
