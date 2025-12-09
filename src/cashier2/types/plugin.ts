// 用于插件中断流程的专用错误
export class PluginAbortError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'PluginAbortError';
  }
}
