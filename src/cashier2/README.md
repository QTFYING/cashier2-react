# Cashier Next SDK

一个现代化、可扩展的支付 SDK，面向 Web 与混合应用（UniApp）。

## 功能特性

- 🔌 **策略模式（Strategy Pattern）**：可在微信、支付宝或自定义支付渠道间轻松切换。
- 🧩 **插件系统（Plugin System）**：支持 Loading、权限校验、日志上报等中间件能力。
- ⚡ **跨平台适配**：内置 Web（H5/PC）与 UniApp 的执行器支持。
- 🔄 **轮询机制**：内置指数退避的轮询器，用于异步支付结果确认。
- 🛠️ **TypeScript**：完整类型定义，开发体验更好。

## 安装

```bash
npm install cashier-next
# 或者
yarn add cashier-next
# 或者
pnpm install cashier-next
```

## 快速开始

### 1. 初始化上下文

```typescript
import { PaymentContext, WechatStrategy, AlipayStrategy } from 'cashier-next';

// 初始化 SDK 上下文
const cashier = new PaymentContext({
  debug: true,
  http: myAxios, // 将自己封装的http实例直接透传
  invokerType: 'uniapp' // 可选：强制指定环境（uniapp、web）
});

// 注册策略
cashier.register(new WechatStrategy({ appId: 'wx888888', mchId: '123456'}));
       .register(new AlipayStrategy({ appId: '2021000000', privateKey: '...'}));
```

### 2. 使用插件

```typescript
  // 插件 C: 日志上报 (对应原“结果读取逻辑”)
  const LoggerPlugin: PaymentPlugin = {
    name: 'logger',
    onBeforePay(ctx) { ... },
    onSuccess(ctx, res) { ... },
    onFail(_ctx, _error) { ... },
  };

cashier.use(LoggerPlugin).use(OtherPlugin);
```

### 3. 发起支付

```typescript
try {
  const result = await cashier.execute('wechat', {
    orderId: 'ORDER_001',
    amount: 100, // 单位：分
    description: 'VIP 订阅',
  });

  if (result.status === 'success') {
    console.log('支付成功！');
  } else if (result.status === 'pending') {
    // 在 PC/Web 场景下，可能返回 pending（等待扫码）
    // 可在此手动开启轮询
    cashier.startPolling('wechat', 'ORDER_001');
  }
} catch (error) {
  console.error('支付失败：', error);
}
```

## 高级用法

### 轮询

SDK 内置 `PollingManager`，可自动以指数退避策略进行状态检查。

```typescript
// 手动开启轮询
cashier.startPolling('wechat', 'ORDER_001');

// 监听轮询结果事件
cashier.on('success', (res) => {
  console.log('轮询成功：', res);
});
```

### 自定义支付方式

扩展 `BaseStrategy` 即可实现你的自定义支付渠道。

```typescript
import { BaseStrategy } from 'cashier-next';

class StripeStrategy extends BaseStrategy {
  readonly name = 'stripe';

  async pay(params, http, invokerType) {
    // 在此实现你的支付逻辑
    return { status: 'success' };
  }

  async getPaySt(orderId) {
    return { status: 'success' };
  }
}

> 自定义的支付策略，则不走SDK内部的入参和报文的归一
```

### Mock 模式

在开发阶段，可开启 Mock 模式以模拟支付流程（无需后端）。

```typescript
const wechat = new WechatStrategy({ appId: 'test', mchId: 'test' }, { mock: true });
```

## 许可证

MIT
