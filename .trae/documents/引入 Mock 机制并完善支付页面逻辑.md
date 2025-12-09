# 完善项目：引入 Mock 机制与支付页面对接

根据您的需求，我制定了以下实施计划，将引入 Mock 机制并完善支付页面逻辑。

## 1. 引入 Mock 机制
### 依赖安装
- 安装 `vite-plugin-mock` 和 `mockjs`，用于拦截前端请求并返回模拟数据。

### 配置与实现
- **配置 Vite**: 修改 `vite.config.ts`，配置 `viteMockServe` 插件，使其在开发环境生效。
- **创建 Mock 文件**: 新建 `mock/payment.ts`，模拟以下接口：
    - `/api/payment/unifiedOrder`: 模拟支付宝/微信统一下单接口，返回预支付订单信息（如 mock 的二维码链接或支付跳转 URL）。
    - `/api/payment/queryOrder`: (可选) 模拟查询订单支付状态。

## 2. 完善 Payment 页面逻辑
### 封装 API 请求
- 新建 `src/api/payment.ts`:
    - 定义支付相关的 TypeScript 接口（入参：金额、支付方式；出参：订单ID、支付参数）。
    - 使用之前封装好的 `src/api/request.ts` 编写 `createUnifiedOrder` 等方法。

### 页面功能升级 (`src/pages/Payment/index.tsx`)
- **UI 增强**:
    - 新增“支付方式”选择器（支付宝 / 微信支付）。
    - 增加支付中/支付结果的交互反馈。
- **逻辑实现**:
    - 替换原有的 `setTimeout` 模拟。
    - 点击“立即支付”后，调用 `createUnifiedOrder` 接口。
    - 根据 Mock 返回的结果，展示“模拟支付成功”的状态或引导用户进行下一步（例如弹窗确认支付）。

## 3. 验证
- 启动开发服务器，检查 Mock 接口是否正常拦截。
- 在 Payment 页面测试支付宝和微信的下单流程，确保数据流转正常。
