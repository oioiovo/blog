#!/usr/bin/env node
/**
 * 用法：pnpm new-post "文章标题" [dir]
 * 例：pnpm new-post "我的新文章" frontend/react
 * 注意：slug 用于 URL，建议手动改成英文短横线（如 my-first-post）
 */
import fs from 'node:fs'
import path from 'node:path'

const title = process.argv[2]
const dir = process.argv[3] ?? 'notes'

if (!title) {
  console.error('用法：pnpm new-post "文章标题" [目录]')
  process.exit(1)
}

// 英文标题自动转 slug，中文标题用日期兜底
let slug = title
  .toLowerCase()
  .replace(/[^\w\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')

if (!slug) {
  slug = `post-${new Date().toISOString().slice(0, 10)}`
}

const today = new Date().toISOString().slice(0, 10)
const filename = path.join(process.cwd(), 'content', 'posts', `${slug}.md`)

if (fs.existsSync(filename)) {
  console.error(`已存在：${filename}`)
  process.exit(1)
}

const template = `---
slug: ${slug}
title: ${title}
summary: 一句话摘要，显示在列表和首页。
date: ${today}
tags: []
dir: ${dir}
---

在这里开始写。

## 小节标题

正文。
`

fs.writeFileSync(filename, template)
console.log(`已创建：${filename}`)
console.log('提示：如果 slug 是中文或日期，请手动改成英文短横线（如 my-first-post）')
console.log('编辑后 push 即可发布。')
