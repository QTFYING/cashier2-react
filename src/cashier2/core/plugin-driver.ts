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
      const isCritical = plugin.critical ?? true; // ⚠️ 默认是关键插件
      const timeoutMs = plugin.timeout ?? 10000; // 默认 10秒超时

      try {
        // 核心：使用 Promise 竞争机制实现超时控制 (Manual Race for Cleanup)
        await this.withTimeout((fn as Function).call(plugin, auditedCtx, ...args), timeoutMs, `Plugin [${plugin.name}] timed out after ${timeoutMs}ms`);

        // 检查是否被插件主动中断 (Abort Logic)
        if (ctx && ctx.aborted) {
          throw new PayError(PayErrorCode.PLUGIN_INTERRUPT, `Aborted by plugin: ${plugin.name}`);
        }
      } catch (err: any) {
        // 场景 A: 自身是 Critical 插件 -> 抛错，中断全流程
        if (isCritical) {
          // 如果已经是 PayError，直接抛；否则包装一下
          if (err instanceof PayError) throw err;
          throw new PayError(PayErrorCode.PLUGIN_ERROR, `[Critical Plugin ${plugin.name}] ${String(hook)} failed: ${err.message}`, err);
        }

        // 场景 B: 自身是 Non-Critical 插件 -> 吞掉错误，仅打印警告，流程继续！
        console.warn(`[⚠️ Non-Critical Plugin ${plugin.name}] error ignored:`, err.message);
      }
    }
  }

  private withTimeout<T>(promise: Promise<T> | void, ms: number, msg: string): Promise<T> {
    if (!promise || typeof (promise as any).then !== 'function') {
      return Promise.resolve(promise as T);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(msg)), ms);
      (promise as Promise<T>).then(
        (res) => {
          clearTimeout(timer);
          resolve(res);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });
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
