import type { PayParams, PayResult, PaySt } from '../types';

/**
 * 定义事件名与对应载荷(Payload)的映射关系
 * 这是实现强类型的关键
 */
export interface SDKEventMap {
  // 支付开始前（适合做埋点、开启 Loading）
  beforePay: PayParams;
  // 支付动作发起（此时通常意味着用户跳转走了，或者弹窗出来了）
  payStart: { strategyName: string };

  // 支付最终结果（成功、失败、取消）
  success: PayResult;
  fail: PayResult;
  cancel: PayResult;

  // 任意状态变更（适合做通用的日志监控）
  statusChange: { status: PaySt; result?: PayResult };
}

// 定义回调函数类型
type EventCallback<K extends keyof SDKEventMap> = (payload: SDKEventMap[K]) => void;

export class EventBus {
  // 存储监听器：Map<事件名, Set<回调函数>>
  private tasks: Map<keyof SDKEventMap, Set<EventCallback<any>>> = new Map();

  /**
   * 订阅事件
   * @param event 事件名 (自动提示)
   * @param callback 回调函数 (参数自动推导)
   */
  on<K extends keyof SDKEventMap>(event: K, callback: EventCallback<K>): void {
    if (!this.tasks.has(event)) {
      this.tasks.set(event, new Set());
    }
    this.tasks.get(event)!.add(callback);
  }

  /**
   * 订阅一次性事件
   */
  once<K extends keyof SDKEventMap>(event: K, callback: EventCallback<K>): void {
    const wrapper = (payload: SDKEventMap[K]) => {
      callback(payload);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * 取消订阅
   */
  off<K extends keyof SDKEventMap>(event: K, callback: EventCallback<K>): void {
    const callbacks = this.tasks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.tasks.delete(event);
      }
    }
  }

  /**
   * 触发事件 (SDK 内部使用，通常设置为 protected，但为了测试方便可以是 public)
   */
  emit<K extends keyof SDKEventMap>(event: K, payload: SDKEventMap[K]): void {
    const callbacks = this.tasks.get(event);
    if (callbacks) {
      callbacks.forEach((fn) => {
        try {
          fn(payload);
        } catch (err) {
          console.error(`[EventBus] Error in listener for "${event}":`, err);
        }
      });
    }
  }

  /**
   * 清空所有事件 (一般用于实例销毁)
   */
  clear(): void {
    this.tasks.clear();
  }
}
