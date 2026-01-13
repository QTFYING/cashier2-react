## 修改 cashier2 指向 @my-cashiers/\*

- 1. 链接 core 包

sudo pnpm link /Users/virgo/Documents/github/cashier/packages/pay-core

- 2. 链接 types 包

sudo pnpm link /Users/virgo/Documents/github/cashier/packages/pay-types

## 在 cashier 目录开个新终端运行：

sudo pnpm dev

或者专门监听 core:

`cd packages/pay-core && npm run build -- --watch`

## 如何恢复？ 调试完想切回 NPM 正式包时

```
sudo pnpm unlink @my-cashier/core @my-cashier/types
sudo pnpm install
```
