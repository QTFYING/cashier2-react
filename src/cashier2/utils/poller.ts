export interface PollerOptions {
  interval?: number; // 基础间隔 (ms)，默认 3000
  maxRetries?: number; // 最大重试次数，默认 0 (无限)
  timeout?: number; // 总超时时间 (ms)，默认 5分钟
  strategy?: 'fixed' | 'exponential'; // 轮询策略：固定 | 指数退避
}

export class Poller {
  private timer: any = null;
  private stopped = false;

  constructor(private options: PollerOptions = {}) {}

  /**
   * 启动轮询
   * @param task 执行的异步任务，返回结果
   * @param validator 校验结果是否终结 (返回 true 表示结束轮询)
   */
  async start<T>(task: () => Promise<T>, validator: (result: T) => boolean): Promise<T> {
    this.stopped = false;
    const { interval = 3000, timeout = 5 * 60 * 1000, strategy = 'fixed' } = this.options;

    const startTime = Date.now();
    let attempt = 0;

    return new Promise((resolve, reject) => {
      const next = async () => {
        // 1. 检查是否手动停止
        if (this.stopped) {
          return reject(new Error('Poller stopped manually'));
        }

        // 2. 检查超时
        if (Date.now() - startTime > timeout) {
          return reject(new Error('Poller timeout'));
        }

        try {
          // 3. 执行任务
          const result = await task();
          attempt++;

          // 4. 验证结果 (比如状态变成了 success 或 fail)
          if (validator(result)) {
            return resolve(result);
          }
        } catch (error) {
          // 可以在这里决定是否要把网络错误视为“继续轮询”的理由
          console.warn('[Poller] Task failed, retrying...', error);
        }

        // 5. 计算下一次延迟
        let delay = interval;
        if (strategy === 'exponential') {
          // 指数退避：3s, 4.5s, 6.75s ... (最大 10s)
          delay = Math.min(interval * Math.pow(1.5, attempt), 10000);
        }

        this.timer = setTimeout(next, delay);
      };

      // 立即执行第一次
      next();
    });
  }

  /**
   * 停止轮询
   * 通常在组件销毁或用户关闭弹窗时调用
   */
  stop() {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
