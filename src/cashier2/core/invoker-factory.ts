import { WebInvoker } from '../invokers';
import { AlipayMiniInvoker } from '../invokers/alipay-mini-invoker';
import type { PaymentInvoker } from '../invokers/types';
import { UniAppInvoker } from '../invokers/uni-invoker';
import { WechatMiniInvoker } from '../invokers/wechat-mini-invoker';

// 全局变量声明
declare const uni: any;
declare const wx: any;
declare const my: any;

export type PayPlatformType = 'wechat' | 'alipay' | 'unionpay' | 'other';

// 为了保持智能提示，保留常用字符串，但允许任意 string
export type InvokerType = 'uniapp' | 'web' | 'wechat-mini' | 'alipay-mini' | string;

// 探测器函数：返回 true 表示当前环境匹配
export type InvokerMatcher = () => boolean;

// 构造器类型
export type InvokerConstructor = new (channel: PayPlatformType) => PaymentInvoker;

// 注册项接口
interface InvokerRegistration {
  type: string;
  InvokerClass: InvokerConstructor;
  matcher: InvokerMatcher;
  priority: number;
}

export class InvokerFactory {
  // 核心注册表
  private static registry: InvokerRegistration[] = [];

  // 静态初始化块 (自动注册内置环境)
  static {
    // 1. UniApp (跨端框架，优先级最高 100)
    this.register('uniapp', UniAppInvoker, () => typeof uni !== 'undefined' && uni.requestPayment, 100);

    // 2. 支付宝小程序 (优先级 50)
    this.register('alipay-mini', AlipayMiniInvoker, () => typeof my !== 'undefined' && my.tradePay, 50);

    // 3. 微信小程序 (优先级 50)
    // 注意：wx 变量最容易被某些 Web 库 polyfill，所以优先级放低一点或放在 UniApp 之后
    this.register('wechat-mini', WechatMiniInvoker, () => typeof wx !== 'undefined' && wx.requestPayment, 50);

    // 4. Web (兜底，优先级 0)
    // matcher 永远返回 true，作为最后的 fallback
    this.register('web', WebInvoker, () => true, 0);
  }

  /**
   * [新增] 注册自定义 Invoker
   * @param type 环境名称 (如 'tiktok-mini')
   * @param InvokerClass 实现类
   * @param matcher 探测函数
   * @param priority 优先级 (越高越先匹配)
   */
  static register(type: string, InvokerClass: InvokerConstructor, matcher: InvokerMatcher, priority: number = 0) {
    this.registry.push({ type, InvokerClass, matcher, priority });
    // 每次注册后重新排序，确保高优先级的先被遍历到
    this.registry.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 创建执行器实例
   */
  static create(channel: PayPlatformType, runtime?: string): PaymentInvoker {
    // Mode 1: 显式指定 (Explicit)
    // 场景：开发者明确知道自己在哪里，或者想强制使用某种模式
    if (runtime) {
      const item = this.registry.find((r) => r.type === runtime);
      if (item) {
        return new item.InvokerClass(channel);
      }
      console.warn(`[InvokerFactory] Runtime "${runtime}" not found, falling back to auto-detect.`);
    }

    // Mode 2: 自动探测 (Auto Detect)
    // 遍历注册表，找到第一个匹配的环境
    for (const item of this.registry) {
      try {
        if (item.matcher()) {
          // 调试模式下可以打印：console.log(`[InvokerFactory] Auto-detected: ${item.type}`);
          return new item.InvokerClass(channel);
        }
      } catch {
        // 忽略探测过程中的报错 (防止访问未定义全局变量抛错)
        continue;
      }
    }

    // 理论上永远不会到这里，因为 WebInvoker 是兜底
    return new WebInvoker(channel);
  }
}
