import { type PaymentPlugin, PluginAbortError } from '../types';

export class PluginDriver {
  constructor(private plugins: PaymentPlugin[] = []) {}

  register(plugin: PaymentPlugin) {
    this.plugins.push(plugin);
  }

  // 按插件注册顺序注入并运行某个 hook（例如 'prepayBefore'）
  async implant<K extends keyof PaymentPlugin>(hook: K, ctx: any, ...args: any[]) {
    for (const plugin of this.plugins) {
      const fn = plugin[hook];
      if (!fn) continue;
      try {
        await (fn as Function).call(plugin, ctx, ...args);
        if (ctx && ctx.aborted) {
          // 某些插件直接设置了 ctx.aborted
          throw new PluginAbortError(`Aborted by plugin ${plugin.name}`);
        }
      } catch (err) {
        // 允许插件抛 PluginAbortError 或其它异常
        if (err instanceof PluginAbortError) throw err;
        // 包装并继续抛出（或根据需要做更细粒度处理）
        throw new Error(`[Plugin ${plugin.name}][${String(hook)}] failed`);
      }
    }
  }
}
