import type { PaymentContextState } from '../types';
import { Poller } from '../utils/poller';
import type { PaymentContext } from './payment-context';

export class PollingManager {
  private activePoller: Poller | null = null;

  constructor(private context: PaymentContext) {}

  /**
   * 启动轮询
   * @param strategyName 策略名称
   * @param orderId 订单号
   */
  start(strategyName: string, orderId: string) {
    // 1. 防御性清理
    this.stop();

    const strategy = this.context.getStrategy(strategyName);
    if (!strategy) {
      console.warn(`[PollingManager] Strategy "${strategyName}" not found.`);
      return;
    }

    console.log(`[PollingManager] Start polling for order: ${orderId}`);

    // 2. 初始化轮询器
    this.activePoller = new Poller({ interval: 3000 });

    // 3. [关键] 恢复上下文状态 (Context Restoration)
    // 从 Context 中读取上一次 execute 结束时保存的状态，防止数据断裂
    const lastState = this.context.getLastContextState();

    const ctx: PaymentContextState = {
      context: this.context,
      params: { orderId, amount: 0 }, // 轮询阶段参数可能不全，以 orderId 为主
      state: { ...lastState }, // 继承之前的状态 (如 startTime)
      currentStatus: 'pending',
    };

    // 4. 启动轮询任务
    this.activePoller
      .start(
        async () => {
          // Task: 查单
          // Strategy 内部会使用注入的 HTTP 实例去请求
          const res = await strategy.getPaySt(orderId);

          // Update Context
          ctx.currentStatus = res.status;
          ctx.result = res;

          // Trigger: 通知业务层 (Event)
          this.context.emit('statusChange', { status: res.status, result: res });

          // 使用 Context 暴露的公共方法触发 onStateChange
          await this.context.driver.implant('onStateChange', ctx, res.status);

          return res;
        },
        // Validator: 成功或失败时停止
        (res) => res.status === 'success' || res.status === 'fail',
      )
      .then(async (finalResult) => {
        // 5. 最终结算
        ctx.result = finalResult;

        if (finalResult.status === 'success') {
          this.context.emit('success', finalResult);
          await this.context.driver.implant('onSuccess', ctx, finalResult);
        } else {
          this.context.emit('fail', finalResult);
          await this.context.driver.implant('onFail', ctx, finalResult);
        }
      })
      .catch((err) => {
        console.warn('[PollingManager] Polling stopped or failed:', err.message);
      })
      .finally(async () => {
        // 无论如何，触发完成钩子 (关闭 Loading 等)
        await this.context.driver.implant('onCompleted', ctx);
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
