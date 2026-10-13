---
title: TypeScript 类型体操之外：写给业务代码的类型设计
summary: 复杂的条件类型很炫，但业务代码更需要的是：让非法状态无法被表示。聊聊判别联合、品牌类型和边界校验。
date: 2026-07-30
tags: ["TypeScript"]
dir: frontend/typescript
---

每次看到 isLoading、isError、data 三个独立的可选字段，我都会想到一个问题：如果 isLoading 是 true 同时 data 也有值，这代表什么？

## 用判别联合消灭非法状态

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
```

这样一来，只有在 status 为 success 的分支里才能访问 data，编译器会帮你检查每一个分支是否都被处理了。

## 品牌类型：区分长得一样的字符串

```ts
type UserId = string & { readonly __brand: 'UserId' }
type OrderId = string & { readonly __brand: 'OrderId' }

function getOrder(id: OrderId) { /* ... */ }

getOrder(userId) // 类型错误
```

## 在边界处校验，在内部信任

- 外部输入（请求体、URL 参数、第三方接口）一律用 schema 校验
- 校验通过后转成精确的内部类型，之后的代码不再重复判断
- 类型定义从 schema 推导，避免两份定义不同步

> 好的类型设计不是让代码更难写，而是让错误的代码写不出来。