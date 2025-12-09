# 支付SDK设计方案

## 目录结构示例

```shell
cashier2/
├── src/
│   ├── adapters/                    # [Adapter] 适配层 (可选，视复杂度而定)
│   │   └── wechat-adapter.ts        # 职责：如果微信参数过于复杂，可在此单独处理数据清洗
│   │   │
│   ├── core/                        # [Core] SDK Core
│   │   ├── event-bus.ts             # [Observer] 事件总线，职责：支持 plugin / context 解耦，抛出 on('success') 等事件
│   │   ├── invoker-factory.ts       # [Invoker] 协调用哪一种方案拉起支付控件
│   │   ├── payment-context.ts       # [Context] 策略上下文/调度中心，职责：管理策略注册(.use)，对外暴露统一执行入口(.execute)
│   │   ├── payment-error.ts         # [Error] 支付错误类
│   │   ├── plugin-driver.ts         # [Plugin] 插件编排
│   │   └── polling-manager.ts       # [Polling] 轮询查单管理器
│   │   │
│   ├── invokers/                    # [Invoker] 调用器层，职责：通过用户传入的调用器类型或根据环境自动推导出对应的调用器实例
│   │   ├── uniApp-invoker.ts        # [Concrete Invoker] UniApp 调用器
│   │   └── web-invoker.ts           # [Concrete Invoker] Web 调用器
│   │
│   ├── strategies/                  # [Strategy] 策略层
│   │   ├── base-strategy.ts         # [Abstract Class] 策略基类/接口定义，职责：定义 abstract pay() 和通用校验逻辑
│   │   ├── wechat-strategy.ts       # [Concrete Strategy] 微信支付策略
│   │   └── alipay-strategy.ts       # [Concrete Strategy] 支付宝支付策略
│   │
│   ├── types/                       # [Type Definitions]
│   │   ├── errors.ts                # Payment Error Code
│   │   ├── http.ts                  # 最小的HttpClient
│   │   ├── index.ts                 # 汇总导出
│   │   ├── invoker.ts               # 支付执行器接口
│   │   ├── lifecycle.ts             # 插件生态的地基
│   │   ├── plugin.ts                # PluginAbortError，插件流转中的专用错误
│   │   └── protocol.ts              # 核心协议：PayParamsPayResult
│   │
│   ├── utils/
│   │   ├── env.ts                   # 环境检测 (isWechat, isMobile)
│   │   ├── fetcher.ts               # 使用原生fetch方法，封装一个简单的GET/POST请求，封装成createDefaultFetcher函数
│   │   ├── poller.ts                # 轮询查单机
│   │   ├── script-loader.ts         # 脚本动态加载器
│   │   └── sign.ts                  # 签名算法工具 (MD5, SHA256)
│   │
│   └── index.ts                     # [Entry] 库入口，负责导出 Context 和 Strategies
│
├── tests/                           # 测试用例 (Vitest/Jest)
│
├── package.json
├── tsconfig.json
└── rollup.config.js                 # 打包配置 (ESM/CJS/UMD)
```
