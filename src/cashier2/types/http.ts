/**
 * 定义一个最小化的 HTTP 客户端接口
 * 只要符合这个形状，无论是 Axios 还是 Ky 还是自定义 fetch 封装都可以
 */
export interface HttpClient {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  // 如果需要支持更多方法，可以在此扩展
}

/**
 * 很多 Axios 用户习惯响应结构包含 data 字段
 * 我们需要定义一个标准响应泛型
 */
export interface HttpResponse<T = any> {
  data: T;
  [key: string]: any;
}
