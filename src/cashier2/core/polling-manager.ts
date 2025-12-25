import type { PayResult } from '../types';
import { Poller } from '../utils/poller';

// 定义轮询的回调接口
export interface PollingCallbacks {
  // 每次查单后的状态变更（用于更新 loading 或提示）
  onStatusChange?: (res: PayResult) => void;
  // 最终成功
  onSuccess?: (res: PayResult) => void;
  // 最终失败
  onFail?: (res: PayResult) => void;
  // 轮询结束（无论成功失败或停止）
  onFinished?: () => void;
}

// 定义查单任务的类型：一个返回 Promise<PayResult> 的函数
export type PollingTask = () => Promise<PayResult>;

export class PollingManager {
  private activePoller: Poller | null = null;

  /**
   * 启动轮询
   * @param task 具体的查单任务 (由调用方封装好)
   * @param callbacks 状态回调集合
   * @param interval 轮询间隔 (ms)
   */
  start(task: PollingTask, callbacks: PollingCallbacks, interval = 3000) {
    // 1. 停止之前的轮询
    this.stop();

    this.activePoller = new Poller({ interval });

    this.activePoller
      .start(
        // Task: 执行传入的纯函数
        async () => {
          const res = await task();
          // 触发过程回调
          callbacks.onStatusChange?.(res);
          return res;
        },
        // Validator: 成功或失败时停止
        (res) => res.status === 'success' || res.status === 'fail',
      )
      .then((finalResult) => {
        // 结算
        if (finalResult.status === 'success') {
          callbacks.onSuccess?.(finalResult);
        } else {
          callbacks.onFail?.(finalResult);
        }
      })
      .catch((err) => {
        console.warn('[PollingManager] Polling stopped or failed:', err.message);
      })
      .finally(() => {
        // 触发结束回调
        callbacks.onFinished?.();
      });
  }

  /**
   * 停止轮询
   */
  stop() {
    if (this.activePoller) {
      this.activePoller.stop();
      this.activePoller = null;
    }
  }
}
