interface ScriptAttributes {
  async?: boolean;
  defer?: boolean;
  [key: string]: any; // 支持 data-client-token 等自定义属性
}

export class ScriptLoader {
  private constructor() {}

  // 核心缓存：Key 是 URL，Value 是加载过程的 Promise
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

    // 2. 也是一种缓存检查：防止页面上原本就已经有了这个 script 标签 (比如服务端渲染或其他 Loader 加载的)
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
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

      // 注入其他自定义属性
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

  /**
   * [新增] 卸载特定脚本
   * 场景：脚本加载失败需要重试、或者组件卸载时清理资源
   * 动作：清除缓存 + 移除 DOM 节点
   */
  static unload(src: string) {
    // 1. 清除 Promise 缓存
    if (this.cache.has(src)) {
      this.cache.delete(src);
    }

    // 2. 移除 DOM 节点 (确保下次 load 是干净的重试)
    const script = document.querySelector(`script[src="${src}"]`);
    if (script) {
      script.remove();
    }
  }

  /**
   * [新增] 重置所有缓存
   * 场景：页面长期运行后清理内存，或者用户登出时重置状态
   * 动作：仅清除 Map 缓存，保留 DOM (防止破坏正在运行的全局变量)
   */
  static clear() {
    this.cache.clear();
  }

  static logger() {
    // 简单的调试辅助
    console.log('[ScriptLoader] Current Cache:', ScriptLoader.cache.keys());
  }
}
