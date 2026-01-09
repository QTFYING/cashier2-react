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

      const auditedCtx = this.createPluginProxy(ctx, plugin.name);

      try {
        await (fn as Function).call(plugin, auditedCtx, ...args);

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

  /**
   * 创建一个递归代理，用于监控插件对 Context 的修改
   */
  private createPluginProxy(ctx: any, pluginName: string) {
    if (typeof Proxy === 'undefined') return ctx;
    const createHandler = (path: string): ProxyHandler<any> => ({
      set: (target, prop, value, receiver) => {
        if (typeof prop === 'string' && !prop.startsWith('_')) {
          // 只有开发环境下才开启 (可以通过全局变量或 SDK Config 判断，这里简化为总是开启或 console检查)
          // 实际生产建议配合 SDKConfig.debug 使用
          console.groupCollapsed(`🕵️ [Context Audit] Plugin "${pluginName}" modified "${path}${prop}"`);
          console.log('Before:', target[prop]);
          console.log('After:', value);
          console.groupEnd();
        }
        return Reflect.set(target, prop, value, receiver);
      },
      get: (target, prop, receiver) => {
        const value = Reflect.get(target, prop, receiver);

        if (typeof value === 'object' && value !== null && (prop === 'params' || prop === 'state' || path !== '') && prop !== 'context') {
          return new Proxy(value, createHandler(`${path}${String(prop)}.`));
        }
        return value;
      },
    });

    return new Proxy(ctx, createHandler(''));
  }
}
