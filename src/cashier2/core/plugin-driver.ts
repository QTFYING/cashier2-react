import { type PaymentPlugin, PayErrorCode } from '../types';
import { PayError } from './payment-error';

export class PluginDriver {
  constructor(private plugins: PaymentPlugin[] = []) {}

  register(plugin: PaymentPlugin) {
    this.plugins.push(plugin);
  }

  async implant<K extends keyof PaymentPlugin>(hook: K, ctx: any, ...args: any[]) {
    for (const plugin of this.plugins) {
      const fn = plugin[hook];
      if (!fn) continue;

      try {
        await (fn as Function).call(plugin, ctx, ...args);

        if (ctx && ctx.aborted) {
          throw new PayError(PayErrorCode.PLUGIN_INTERRUPT, `Aborted by plugin: ${plugin.name}`);
        }
      } catch (err: any) {
        if (err instanceof PayError) {
          throw err;
        }

        throw new PayError(PayErrorCode.PLUGIN_ERROR, `[Plugin ${plugin.name}] ${String(hook)} failed: ${err.message}`, err);
      }
    }
  }
}
