export interface WebChannelHandler {
  /**
   * 核心处理逻辑
   * @param data 经过 Adapter 转换后的数据
   * @returns 动作指令或原始结果
   */
  handle(data: any): Promise<any>;
}

export class WebInvokerFactory {
  private static handlers: Map<string, WebChannelHandler> = new Map();

  static register(channel: string, handler: WebChannelHandler) {
    this.handlers.set(channel, handler);
  }

  static get(channel: string): WebChannelHandler | undefined {
    return this.handlers.get(channel);
  }
}
