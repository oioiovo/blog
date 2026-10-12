# 博客内容维护指南

## 一、本地启动

```bash
pnpm install
pnpm dev
```

访问 http://localhost:3000，改代码自动热更新。

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

## 三、文章操作

所有文章在 `lib/posts.ts`，是一个 `Post[]` 数组。

### 文章结构

```ts
{
  slug: 'my-first-post',           // URL 标识，会出现在 /posts/my-first-post
  title: '文章标题',
  summary: '一句话摘要，显示在列表和首页',
  date: '2026-10-12',              // YYYY-MM-DD
  tags: ['React', 'Next.js'],      // 标签
  dir: 'frontend/react',           // 目录路径，决定在左侧树的位置
  body: [
    { type: 'p', text: '段落文字' },
    { type: 'h2', id: 'section-id', text: '小节标题' },
    { type: 'code', lang: 'tsx', code: `代码块` },
    { type: 'ul', items: ['列表项1', '列表项2'] },
    { type: 'quote', text: '引用文字' },
  ],
}
```

### 正文块类型

| type | 用途 | 必填字段 |
|---|---|---|
| `p` | 段落 | `text` |
| `h2` | 小节标题（自动进右侧目录） | `id`, `text` |
| `code` | 代码块 | `lang`, `code` |
| `ul` | 无序列表 | `items: string[]` |
| `quote` | 引用块 | `text` |

### 新增文章

1. 在 `lib/posts.ts` 的 `posts` 数组末尾加一个新对象
2. `slug` 用英文短横线命名（如 `my-first-post`）
3. `dir` 决定目录树位置。如果是新目录，在 `DIR_LABELS` 里加中文标签：
   ```ts
   export const DIR_LABELS = {
     'newdir/subdir': '中文标签',
   }
   ```
4. 本地 `pnpm dev` 确认显示正常
5. commit + push，Actions 自动部署

### 修改文章

直接改 `lib/posts.ts` 里对应文章对象的字段，push 即可。

### 删除文章

从 `posts` 数组里删掉对应对象，push 即可。

---

## 四、目录标签

`lib/posts.ts` 顶部：

```ts
export const DIR_LABELS: Record<string, string> = {
  frontend: '前端',
  'frontend/react': 'React 生态',
  backend: '后端',
  // 新增目录在这里加
}
```

key 是 `dir` 路径，value 是左侧目录树里显示的中文名。

---

## 五、部署流程

每次 push 到 `main` 分支，GitHub Actions 自动执行：

1. checkout 代码
2. `pnpm install`
3. `pnpm build`（静态导出到 `out/`）
4. 部署到 GitHub Pages

约 1-2 分钟后线上 https://oioiovo.github.io/blog/ 更新。

查看部署状态：https://github.com/oioiovo/blog/actions

---

## 六、提交命令速查

```bash
git add -A
git commit -m "feat: add post xxx"
git push
```
