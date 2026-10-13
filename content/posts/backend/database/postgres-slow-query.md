---
slug: postgres-slow-query
title: 一次 Postgres 慢查询排查：从 3 秒到 30 毫秒
summary: 一个看起来人畜无害的列表接口，在数据量涨到百万级之后突然变慢。记录一下用 EXPLAIN ANALYZE 一步步定位的过程。
date: 2026-09-10
tags: [数据库, 性能]
dir: backend/database
---

某天早上收到告警：后台的订单列表接口 P95 延迟超过了 3 秒。代码最近没有改动，唯一的变化是订单表在过去一个月里涨到了 120 万行。

## 先看执行计划

```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE tenant_id = $1 AND status = 'paid'
ORDER BY created_at DESC
LIMIT 20;
```

结果显示 Postgres 走的是 created_at 上的索引做倒序扫描，然后逐行过滤 tenant_id 和 status。对于小租户来说，它需要扫描几十万行才能凑够 20 条。

## 复合索引的列顺序

解决方法是建立一个和查询形状完全匹配的复合索引。等值条件放前面，排序字段放最后：

```sql
CREATE INDEX CONCURRENTLY idx_orders_tenant_status_created
ON orders (tenant_id, status, created_at DESC);
```

- 用 CONCURRENTLY 避免在线上锁表
- 索引列顺序：等值过滤 → 范围过滤 → 排序
- 建完记得再跑一次 EXPLAIN ANALYZE 确认命中

## 结果

索引建好后，同一个查询的执行时间从 3100ms 降到了 28ms，执行计划变成了一次干净的 Index Scan。顺手把 SELECT * 改成了只取列表需要的字段，返回体积也小了一半。

> 数据库不会骗人，执行计划就是最好的文档。
