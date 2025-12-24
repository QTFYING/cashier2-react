import { InvokerFactory } from '../../cashier2';
import { TiktokInvoker } from './tiktok-invoker';

declare const tt: any;

const judgingEnv = () => typeof tt !== 'undefined' && typeof tt.pay === 'function';

InvokerFactory.register('tiktok', TiktokInvoker, judgingEnv, 60);
