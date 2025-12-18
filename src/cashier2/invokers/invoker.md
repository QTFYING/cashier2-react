# Invoker行为

## 微信支付 （四大金刚）

- JSAPI 调用wx.requestPayment，小程序也是
- APP 调用原生SDK
- H5 location.href 跳转
- Native 渲染二维码

| 步骤 | 执行者   | 动作                         | 数据流动                   | 这里的 Adapter 做什么？                     |
| ---- | -------- | ---------------------------- | -------------------------- | ------------------------------------------- |
| 1    | Strategy | signAndCreateOrder           | User Params -> Backend     | adapter.transform (入参转换)                |
| 2    | Strategy | (拿到后端返回)               | Backend -> SignedData      | 啥都不做！ (相信后端返回的就是标准签名包)   |
| 3    | Strategy | invoker.invoke(SignedData)   | SignedData -> UniApp/Wx    | Invoker 把签名包解构传给 uni.requestPayment |
| 4    | User     | 输密码，确认支付             | (用户交互中...)            | (等待...)                                   |
| 5    | Invoker  | (拿到原生回调)               | Native SDK -> RawResult    | (例如 requestPayment:ok)                    |
| 6    | Strategy | adapter.normalize(RawResult) | RawResult -> PaymentResult | 这才是 normalize 出场的时候！               |

## 支付宝

- 待定
