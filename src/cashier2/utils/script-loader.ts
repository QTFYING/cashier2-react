interface ScriptAttributes {
  async?: boolean;
  defer?: boolean;
  [key: string]: any; // 支持 data-client-token 等自定义属性
}

export class ScriptLoader {
  // 核心缓存：Key 是 URL，Value 是加载过程的 Promise
  // 使用 Promise 缓存可以完美解决并发加载问题：
  // 即使同时调用 10 次 load('stripe.js')，网络请求也只会发一次。
  private static cache: Map<string, Promise<void>> = new Map();

  /**
   * 动态加载外部脚本
   * @param src 脚本地址
   * @param attrs 额外的 script 标签属性 (如 data-appid)
   */
  static load(src: string, attrs: ScriptAttributes = {}): Promise<void> {
    // 1. 命中缓存：如果已经在加载中或加载完成了，直接返回同一个 Promise
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // 2. 也是一种缓存检查：防止页面上原本就已经有了这个 script 标签
    if (document.querySelector(`script[src="${src}"]`)) {
      const promise = Promise.resolve();
      this.cache.set(src, promise);
      return promise;
    }

    // 3. 创建加载任务
    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';

      // 处理 async / defer
      script.async = attrs.async !== false; // 默认 async
      script.defer = attrs.defer || false;

      // 注入其他自定义属性 (比如 PayPal 需要 data-namespace)
      Object.keys(attrs).forEach((key) => {
        if (key !== 'async' && key !== 'defer') {
          script.setAttribute(key, attrs[key]);
        }
      });

      // 4. 事件绑定
      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        // 失败时从缓存移除，允许下一次重试
        this.cache.delete(src);
        // 移除标签，保持 DOM 干净
        script.remove();
        reject(new Error(`[ScriptLoader] Failed to load script: ${src}`));
      };

      // 5. 插入 DOM
      document.head.appendChild(script);
    });

    // 写入缓存
    this.cache.set(src, promise);
    return promise;
  }

  public logger() {}
}
