# 谌 · 开发笔记

个人博客，基于 Next.js 16 + GitHub Pages 静态部署。

## 技术栈

- **框架**：Next.js 16 (App Router, Turbopack)
- **部署**：GitHub Actions → GitHub Pages
- **文章格式**：Markdown + frontmatter
- **样式**：Tailwind CSS 4 (oklch 配色)
- **图表**：Mermaid
- **后台管理**：Tauri 2 桌面端（Rust + Axum）

## 项目结构

```
├── app/                    # Next.js 路由
│   ├── page.tsx            # 首页
│   ├── posts/              # 文章列表与详情
│   └── about/              # 关于页
├── components/              # React 组件
├── content/
│   ├── posts/              # 文章 (按目录组织)
│   │   └── <分类>/<slug>.md
│   └── README.md           # 关于页自我介绍
├── config/
│   ├── site.json           # 站点信息
│   ├── about.json          # 技术栈与经历
│   └── projects.json       # 开源项目
├── lib/                    # 工具函数
├── public/
│   └── images/             # 图片资源
├── admin/                  # Web 管理后台前端
│   └── server.mjs          # Express API (旧版，已被 Rust 替代)
└── src-tauri/              # Tauri 桌面管理工具
    └── src/main.rs         # Rust + Axum 后端
```

## 文章格式

```markdown
---
title: 文章标题
slug: ascii-slug-for-url
summary: 摘要
date: 2026-10-15
tags: [tag1, tag2]
---

正文内容...
```

- `slug`：ASCII 字符，用于 URL（GitHub Pages 不支持中文文件名）
- `summary`：显示在文章列表和 meta description

## 本地开发

```bash
pnpm install
pnpm dev
```

访问 http://localhost:3000/blog/

## 部署

推送到 `main` 分支自动触发 GitHub Actions 构建并部署到 GitHub Pages。

## 桌面管理工具

Tauri 桌面端用于管理文章和站点配置：

```bash
cd src-tauri
cargo tauri dev
```

release 编译：

```bash
cargo build --release --manifest-path src-tauri/Cargo.toml
```

产物：`src-tauri/target/release/blog-admin.exe`

首次运行自动 clone 仓库到 exe 同目录的 `blog/` 子文件夹。

## License

MIT
