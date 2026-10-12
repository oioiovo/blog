---
slug: rethinking-data-fetching-in-rsc
title: 在 React Server Components 里重新思考数据获取
summary: 从 useEffect + loading 状态，到在组件里直接 await。RSC 改变的不只是写法，而是数据和 UI 之间的边界。
date: 2026-09-28
tags: [React, Next.js]
dir: frontend/react
---

过去几年，我在客户端写数据获取的方式几乎固定：组件挂载，useEffect 发请求，维护 loading、error、data 三个状态。后来有了 SWR 和 React Query，样板代码少了很多，但数据依然是「渲染之后才开始拿」。

Server Components 把这件事倒了过来：组件本身就运行在服务器上，可以直接 await 数据库或者内部服务，渲染结果以流的形式发送到浏览器。

## 把数据挪到离组件最近的地方

以前为了避免瀑布请求，我们习惯在页面顶层一次性拿完所有数据，再通过 props 一层层往下传。在 RSC 里，更自然的做法是让每个需要数据的组件自己去拿：

```tsx
export default async function RecentOrders({ userId }: { userId: string }) {
  const orders = await db.order.findMany({
    where: { userId },
    take: 5,
    orderBy: { createdAt: 'desc' },
  })

  return <OrderList orders={orders} />
}
```

配合 Suspense，每个区块都可以独立流式输出，慢的部分不会拖住快的部分。

## 客户端边界要画得克制

"use client" 是一条边界，而不是一个标签。边界以下的所有模块都会进入客户端 bundle。我的经验是：把交互最小化地包成叶子组件，比如一个按钮、一个输入框，而不是给整个页面加上 "use client"。

- 需要 state、effect 或浏览器 API 的组件才放到客户端
- 服务器组件可以把服务器组件作为 children 传给客户端组件
- 传给客户端组件的 props 必须可序列化

## 我的一点体会

> 最好的 loading 状态，是用户根本看不到的 loading 状态。

RSC 并不是要取代客户端数据获取。实时性很强、需要频繁变化的数据，依然适合 SWR 这类工具。但对大部分「打开页面就要看到」的内容来说，在服务器上拿好数据再渲染，是更简单也更快的选择。
