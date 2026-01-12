import type { PaymentContext } from '../core/payment-context';
import type { PayParams, PayResult, PaySt } from './protocol';

/**
 * 1. 运行时上下文 (Mutable Context)
 * 插件可以直接修改这个对象中的属性，从而影响后续流程
 */
export interface PaymentContextState {
  // context为宿主 Context 的引用，让插件能操作 Bus
  context: PaymentContext;

  // 阶段 1: 初始入参 (可被修改，如增加 token)
  params: PayParams;

  // 阶段 2: 后端预下单/签名返回的原始数据
  apiResponse?: any;

  // 阶段 3: 转换后准备传给第三方 SDK 的参数 (如微信的 timestamp, nonceStr)
  providerPayload?: any;

  // 阶段 4: 轮询或执行过程中的临时状态
  currentStatus?: PaySt;

  // 阶段 5: 最终归一化结果
  result?: PayResult;

  // 共享状态 (用于插件间传值，类似 Koa ctx.state)
  state: Record<string, any>;
}

/**
 * 2. 插件接口定义 (Vite Style)
 */
export interface PaymentPlugin {
  name: string; // 插件唯一标识
  enforce?: 'pre' | 'post'; // 强制执行顺序 (可选)

  /**
   * 是否为关键插件 (默认 true)
   * - true: 插件抛错会导致整个支付流程终止 (如 Auth, Risk)
   * - false: 插件抛错会被忽略，只打印警告 (如 Logger, Analytics)
   */
  critical?: boolean;

  /**
   * 插件执行超时时间 (毫秒)，默认 10000ms
   * 防止某个非关键插件卡死主流程
   */
  timeout?: number;

  // --- Stage 1: 准备 (Validation & Guard) ---
  /**
   * 支付开始前触发
   * 场景：参数校验、权限检查(未登录阻断)、添加公共参数、开启全局 Loading
   * @returns 如果抛出错误，流程直接终止
   */
  onBeforePay?(ctx: PaymentContextState): Promise<void> | void;

  // --- Stage 2: 交互 (Server Interaction) ---
  /**
   * 请求后端签名/预下单接口之前触发
   * 场景：注入 Auth Token、修改 API URL、添加特殊 Header
   */
  onBeforeSign?(ctx: PaymentContextState): Promise<void> | void;

  /**
   * 拿到后端签名结果之后触发
   * 场景：后端数据清洗、错误预判 (后端返回了业务错误码)
   */
  onAfterSign?(ctx: PaymentContextState): Promise<void> | void;

  // --- Stage 3: 适配 (Adaptation) ---
  /**
   * 真正唤起第三方 SDK (或跳转) 之前触发
   * 场景：动态加载 JS-SDK 脚本、埋点上报"开始唤起"
   */
  onBeforeInvoke?(ctx: PaymentContextState): Promise<void> | void;

  // --- Stage 4: 执行 (Running) ---
  /**
   * 状态变更时触发 (主要用于轮询或长连接场景)
   * 场景：UI 更新 "正在查询结果..."
   */
  onStateChange?(ctx: PaymentContextState, status: PaySt): void;

  // --- Stage 5: 结算 (Settlement) ---
  /**
   * 支付成功时触发
   * 场景：埋点"支付成功"、跳转成功页
   */
  onSuccess?(ctx: PaymentContextState, result: PayResult): Promise<void> | void;

  /**
   * 支付失败时触发 (包含用户取消)
   * 场景：错误上报 Sentry、Toast 提示
   */
  onFail?(ctx: PaymentContextState, error: Error | PayResult): Promise<void> | void;

  /**
   * 流程结束触发 (无论成功失败，类似 finally)
   * 场景：关闭 Loading、销毁临时资源
   */
  onCompleted?(ctx: PaymentContextState): Promise<void> | void;
}
