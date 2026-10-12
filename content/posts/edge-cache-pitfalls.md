---
slug: edge-cache-pitfalls
title: 边缘缓存的那些坑
summary: Cache-Control、stale-while-revalidate、Vary 头，以及一次因为缓存了带 Cookie 的响应而导致的线上事故。
date: 2026-07-08
tags: [架构, 性能]
dir: backend/architecture
---

把页面放到 CDN 边缘缓存，是性价比最高的性能优化之一。但缓存也是最容易出事故的地方：缓存了不该缓存的东西，比没有缓存更糟糕。

## 先搞清楚几个响应头

```http
Cache-Control: public, s-maxage=60, stale-while-revalidate=600
```

- s-maxage 只对共享缓存（CDN）生效，max-age 对浏览器生效
- stale-while-revalidate 允许在后台刷新时先返回旧内容
- private 表示只能被浏览器缓存，绝不能进 CDN

## 一次事故

某个接口根据 Cookie 返回当前用户的信息，但响应头里误设了 public。结果是：第一个访问的用户的信息被缓存，后续所有人看到的都是同一个人的头像和昵称。

修复方式很简单，个性化响应一律设置 private, no-store。但更重要的是在框架层面加上约束：读取了 Cookie 的路由默认禁止公共缓存。

## 上线前的检查清单

- 这个响应是否因用户而异？
- 是否设置了正确的 Vary 头？
- 内容更新后，最长多久会被用户看到？这个延迟能接受吗？
