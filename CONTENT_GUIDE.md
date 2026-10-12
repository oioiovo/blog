# 博客内容维护指南

## 一、本地启动

```bash
pnpm install
pnpm dev
```

访问 http://localhost:3000，改文件自动热更新。

---

## 二、改站点信息

所有站点信息都在 `lib/site.ts`：

```ts
export const site = {
  name: '谌',                    // 名字，首页大标题
  handle: 'oioiovo',             // 顶部导航显示的 ~/handle
  title: '谌 · 开发笔记',         // 浏览器标签
  tagline: '写代码，也写下写代码时的思考。',  // 首页大标题第二行
  bio: '全栈开发者...',            // 首页自我介绍段落
  description: '...',             // SEO 描述
  email: 'shirley.chen0x0@icloud.com',
  url: 'https://oioiovo.github.io/blog',
  github: 'https://github.com/oioiovo',
  twitter: 'https://x.com/oioiovo',
}

// 首页"开源项目"列表
export const projects = [
  { name: '...', description: '...', href: '...', meta: '...' },
]
```

---

## 三、写新文章（Markdown）

### 方式一：用脚本生成模板

```bash
pnpm new-post "文章标题" [目录]
# 例：pnpm new-post "我的新文章" frontend/react
```

会在 `content/posts/` 下生成一个 `.md` 文件。

### 方式二：直接在 Obsidian / VS Code 里建文件

在 `content/posts/` 下新建 `.md` 文件，文件名就是 URL slug（如 `my-first-post.md`）。

### 文件格式

```markdown
---
slug: my-first-post
title: 文章标题
summary: 一句话摘要，显示在列表和首页
date: 2026-10-12
tags: [React, Next.js]
dir: frontend/react
---

这里写正文，用标准 Markdown。

## 小节标题

段落文字。

- 列表项
- 列表项

```tsx
代码块
```

> 引用文字
```

### frontmatter 字段说明

| 字段 | 必填 | 说明 |
|---|---|---|
| `slug` | 是 | URL 标识，和文件名一致 |
| `title` | 是 | 文章标题 |
| `summary` | 是 | 一句话摘要 |
| `date` | 是 | YYYY-MM-DD |
| `tags` | 否 | 标签数组 |
| `dir` | 是 | 目录路径，决定左侧树位置 |

### 支持的 Markdown 语法

- 段落（普通文字）
- `## 二级标题`（自动进右侧目录）
- 代码块（带语言标注，自动显示语言标签）
- 无序列表 `- item`
- 引用 `> text`

---

## 四、修改 / 删除文章

直接编辑或删除 `content/posts/` 下对应的 `.md` 文件即可。

---

## 五、目录标签

左侧目录树的中文名在 `lib/posts.ts` 顶部：

```ts
export const DIR_LABELS = {
  frontend: '前端',
  'frontend/react': 'React 生态',
  // 新目录在这里加
}
```

---

## 六、发布流程

```bash
git add -A
git commit -m "feat: add post xxx"
git push
```

GitHub Actions 自动 build + 部署，约 1-2 分钟后线上 https://oioiovo.github.io/blog/ 更新。

查看部署状态：https://github.com/oioiovo/blog/actions
