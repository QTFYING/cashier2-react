/**
 * 定义一个最小化的 HTTP 客户端接口
 * 只要符合这个形状，无论是 Axios 还是 Ky 还是自定义 fetch 封装都可以
 * 返回的结果直接是data，SDK不从Response中提取data
 * 原因是fetch、ajax返回的就是data
 * axios返回的是{data: T, status: 200, ...}
 * uni.request等返回的是{data: T, statusCode: 200, ...}
 */
export interface HttpClient {
  get<T = any>(url: string, config?: any): Promise<T>;
  // 约束：所有的 post 必须返回 Promise<T>，这个 T 就是纯净的后端 Data
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  // ...
}

/**
 * 很多 Axios 用户习惯响应结构包含 data 字段
 * 我们需要定义一个标准响应泛型
 */
export interface HttpResponse<T = any> {
  data: T;
  code: string;
  message: string;
}
