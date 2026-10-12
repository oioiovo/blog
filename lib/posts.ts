export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; id: string; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'ul'; items: string[] }
  | { type: 'quote'; text: string }

export type Post = {
  slug: string
  title: string
  summary: string
  date: string
  tags: string[]
  dir: string
  body: Block[]
}

export const DIR_LABELS: Record<string, string> = {
  frontend: '前端',
  'frontend/react': 'React 生态',
  'frontend/typescript': '类型系统',
  backend: '后端',
  'backend/database': '数据库',
  'backend/architecture': '架构与部署',
  tools: '工具',
  'tools/rust': 'Rust',
  notes: '随笔',
}

const posts: Post[] = [
  {
    slug: 'rethinking-data-fetching-in-rsc',
    title: '在 React Server Components 里重新思考数据获取',
    summary:
      '从 useEffect + loading 状态，到在组件里直接 await。RSC 改变的不只是写法，而是数据和 UI 之间的边界。',
    date: '2026-09-28',
    tags: ['React', 'Next.js'],
    dir: 'frontend/react',
    body: [
      {
        type: 'p',
        text: '过去几年，我在客户端写数据获取的方式几乎固定：组件挂载，useEffect 发请求，维护 loading、error、data 三个状态。后来有了 SWR 和 React Query，样板代码少了很多，但数据依然是「渲染之后才开始拿」。',
      },
      {
        type: 'p',
        text: 'Server Components 把这件事倒了过来：组件本身就运行在服务器上，可以直接 await 数据库或者内部服务，渲染结果以流的形式发送到浏览器。',
      },
      { type: 'h2', id: 'move-data-closer', text: '把数据挪到离组件最近的地方' },
      {
        type: 'p',
        text: '以前为了避免瀑布请求，我们习惯在页面顶层一次性拿完所有数据，再通过 props 一层层往下传。在 RSC 里，更自然的做法是让每个需要数据的组件自己去拿：',
      },
      {
        type: 'code',
        lang: 'tsx',
        code: `export default async function RecentOrders({ userId }: { userId: string }) {
  const orders = await db.order.findMany({
    where: { userId },
    take: 5,
    orderBy: { createdAt: 'desc' },
  })

  return <OrderList orders={orders} />
}`,
      },
      {
        type: 'p',
        text: '配合 Suspense，每个区块都可以独立流式输出，慢的部分不会拖住快的部分。',
      },
      { type: 'h2', id: 'client-boundary', text: '客户端边界要画得克制' },
      {
        type: 'p',
        text: '"use client" 是一条边界，而不是一个标签。边界以下的所有模块都会进入客户端 bundle。我的经验是：把交互最小化地包成叶子组件，比如一个按钮、一个输入框，而不是给整个页面加上 "use client"。',
      },
      {
        type: 'ul',
        items: [
          '需要 state、effect 或浏览器 API 的组件才放到客户端',
          '服务器组件可以把服务器组件作为 children 传给客户端组件',
          '传给客户端组件的 props 必须可序列化',
        ],
      },
      { type: 'h2', id: 'what-i-learned', text: '我的一点体会' },
      {
        type: 'quote',
        text: '最好的 loading 状态，是用户根本看不到的 loading 状态。',
      },
      {
        type: 'p',
        text: 'RSC 并不是要取代客户端数据获取。实时性很强、需要频繁变化的数据，依然适合 SWR 这类工具。但对大部分「打开页面就要看到」的内容来说，在服务器上拿好数据再渲染，是更简单也更快的选择。',
      },
    ],
  },
  {
    slug: 'postgres-slow-query',
    title: '一次 Postgres 慢查询排查：从 3 秒到 30 毫秒',
    summary:
      '一个看起来人畜无害的列表接口，在数据量涨到百万级之后突然变慢。记录一下用 EXPLAIN ANALYZE 一步步定位的过程。',
    date: '2026-09-10',
    tags: ['数据库', '性能'],
    dir: 'backend/database',
    body: [
      {
        type: 'p',
        text: '某天早上收到告警：后台的订单列表接口 P95 延迟超过了 3 秒。代码最近没有改动，唯一的变化是订单表在过去一个月里涨到了 120 万行。',
      },
      { type: 'h2', id: 'explain', text: '先看执行计划' },
      {
        type: 'code',
        lang: 'sql',
        code: `EXPLAIN ANALYZE
SELECT * FROM orders
WHERE tenant_id = $1 AND status = 'paid'
ORDER BY created_at DESC
LIMIT 20;`,
      },
      {
        type: 'p',
        text: '结果显示 Postgres 走的是 created_at 上的索引做倒序扫描，然后逐行过滤 tenant_id 和 status。对于小租户来说，它需要扫描几十万行才能凑够 20 条。',
      },
      { type: 'h2', id: 'composite-index', text: '复合索引的列顺序' },
      {
        type: 'p',
        text: '解决方法是建立一个和查询形状完全匹配的复合索引。等值条件放前面，排序字段放最后：',
      },
      {
        type: 'code',
        lang: 'sql',
        code: `CREATE INDEX CONCURRENTLY idx_orders_tenant_status_created
ON orders (tenant_id, status, created_at DESC);`,
      },
      {
        type: 'ul',
        items: [
          '用 CONCURRENTLY 避免在线上锁表',
          '索引列顺序：等值过滤 → 范围过滤 → 排序',
          '建完记得再跑一次 EXPLAIN ANALYZE 确认命中',
        ],
      },
      { type: 'h2', id: 'result', text: '结果' },
      {
        type: 'p',
        text: '索引建好后，同一个查询的执行时间从 3100ms 降到了 28ms，执行计划变成了一次干净的 Index Scan。顺手把 SELECT * 改成了只取列表需要的字段，返回体积也小了一半。',
      },
      {
        type: 'quote',
        text: '数据库不会骗人，执行计划就是最好的文档。',
      },
    ],
  },
  {
    slug: 'building-a-rust-cli',
    title: '用 Rust 写一个命令行工具的完整过程',
    summary:
      '从 cargo new 到发布到 crates.io：参数解析、错误处理、彩色输出、跨平台打包，一个周末项目的完整记录。',
    date: '2026-08-22',
    tags: ['Rust', '工具'],
    dir: 'tools/rust',
    body: [
      {
        type: 'p',
        text: '我一直想要一个小工具：扫描项目里所有的 TODO 注释，按文件和作者汇总出来。正好借这个机会，把用 Rust 写 CLI 的流程完整走一遍。',
      },
      { type: 'h2', id: 'clap', text: '用 clap 解析参数' },
      {
        type: 'code',
        lang: 'rust',
        code: `use clap::Parser;

#[derive(Parser)]
#[command(name = "todos", version, about = "扫描代码里的 TODO")]
struct Cli {
    /// 要扫描的目录
    #[arg(default_value = ".")]
    path: std::path::PathBuf,

    /// 以 JSON 格式输出
    #[arg(long)]
    json: bool,
}`,
      },
      {
        type: 'p',
        text: 'derive 宏让参数定义和帮助文档写在一起，--help 的输出几乎不需要额外维护。',
      },
      { type: 'h2', id: 'errors', text: '错误处理：anyhow 就够了' },
      {
        type: 'p',
        text: '对于应用程序来说，anyhow 提供的 Result 和 context 已经足够好用。库才需要用 thiserror 精细地定义错误类型。',
      },
      {
        type: 'ul',
        items: [
          '用 .context() 给每个可能失败的步骤加上人话描述',
          '在 main 里返回 anyhow::Result<()>，错误会自动打印',
          '用 ignore crate 遍历目录，天然支持 .gitignore',
        ],
      },
      { type: 'h2', id: 'release', text: '打包与发布' },
      {
        type: 'p',
        text: '最后用 cargo-dist 生成了 GitHub Actions 配置，每次打 tag 自动构建 macOS、Linux、Windows 三个平台的二进制，并生成一行安装脚本。从写下第一行代码到发布，总共一个周末。',
      },
    ],
  },
  {
    slug: 'types-for-business-code',
    title: 'TypeScript 类型体操之外：写给业务代码的类型设计',
    summary:
      '复杂的条件类型很炫，但业务代码更需要的是：让非法状态无法被表示。聊聊判别联合、品牌类型和边界校验。',
    date: '2026-07-30',
    tags: ['TypeScript'],
    dir: 'frontend/typescript',
    body: [
      {
        type: 'p',
        text: '每次看到 isLoading、isError、data 三个独立的可选字段，我都会想到一个问题：如果 isLoading 是 true 同时 data 也有值，这代表什么？',
      },
      { type: 'h2', id: 'discriminated-union', text: '用判别联合消灭非法状态' },
      {
        type: 'code',
        lang: 'ts',
        code: `type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }`,
      },
      {
        type: 'p',
        text: '这样一来，只有在 status 为 success 的分支里才能访问 data，编译器会帮你检查每一个分支是否都被处理了。',
      },
      { type: 'h2', id: 'branded-types', text: '品牌类型：区分长得一样的字符串' },
      {
        type: 'code',
        lang: 'ts',
        code: `type UserId = string & { readonly __brand: 'UserId' }
type OrderId = string & { readonly __brand: 'OrderId' }

function getOrder(id: OrderId) { /* ... */ }

getOrder(userId) // 类型错误`,
      },
      { type: 'h2', id: 'validate-at-boundary', text: '在边界处校验，在内部信任' },
      {
        type: 'ul',
        items: [
          '外部输入（请求体、URL 参数、第三方接口）一律用 schema 校验',
          '校验通过后转成精确的内部类型，之后的代码不再重复判断',
          '类型定义从 schema 推导，避免两份定义不同步',
        ],
      },
      {
        type: 'quote',
        text: '好的类型设计不是让代码更难写，而是让错误的代码写不出来。',
      },
    ],
  },
  {
    slug: 'edge-cache-pitfalls',
    title: '边缘缓存的那些坑',
    summary:
      'Cache-Control、stale-while-revalidate、Vary 头，以及一次因为缓存了带 Cookie 的响应而导致的线上事故。',
    date: '2026-07-08',
    tags: ['架构', '性能'],
    dir: 'backend/architecture',
    body: [
      {
        type: 'p',
        text: '把页面放到 CDN 边缘缓存，是性价比最高的性能优化之一。但缓存也是最容易出事故的地方：缓存了不该缓存的东西，比没有缓存更糟糕。',
      },
      { type: 'h2', id: 'headers', text: '先搞清楚几个响应头' },
      {
        type: 'code',
        lang: 'http',
        code: `Cache-Control: public, s-maxage=60, stale-while-revalidate=600`,
      },
      {
        type: 'ul',
        items: [
          's-maxage 只对共享缓存（CDN）生效，max-age 对浏览器生效',
          'stale-while-revalidate 允许在后台刷新时先返回旧内容',
          'private 表示只能被浏览器缓存，绝不能进 CDN',
        ],
      },
      { type: 'h2', id: 'incident', text: '一次事故' },
      {
        type: 'p',
        text: '某个接口根据 Cookie 返回当前用户的信息，但响应头里误设了 public。结果是：第一个访问的用户的信息被缓存，后续所有人看到的都是同一个人的头像和昵称。',
      },
      {
        type: 'p',
        text: '修复方式很简单，个性化响应一律设置 private, no-store。但更重要的是在框架层面加上约束：读取了 Cookie 的路由默认禁止公共缓存。',
      },
      { type: 'h2', id: 'checklist', text: '上线前的检查清单' },
      {
        type: 'ul',
        items: [
          '这个响应是否因用户而异？',
          '是否设置了正确的 Vary 头？',
          '内容更新后，最长多久会被用户看到？这个延迟能接受吗？',
        ],
      },
    ],
  },
  {
    slug: 'my-dev-setup-2026',
    title: '我的 2026 开发环境配置',
    summary:
      '终端、编辑器、键盘和一些小工具。不追求最新，只追求顺手——这一套我已经用了一年多没大改过。',
    date: '2026-06-15',
    tags: ['工具', '随笔'],
    dir: 'notes',
    body: [
      {
        type: 'p',
        text: '经常有朋友问我用什么工具。与其每次回答，不如写下来。先说结论：工具没有好坏，顺手最重要，而顺手来自长期不折腾。',
      },
      { type: 'h2', id: 'terminal', text: '终端' },
      {
        type: 'ul',
        items: [
          '终端：Ghostty，启动快，配置是一个纯文本文件',
          'Shell：zsh + starship 提示符，只显示目录、git 分支和运行时版本',
          '常用工具：ripgrep、fd、fzf、zoxide、lazygit',
        ],
      },
      { type: 'h2', id: 'editor', text: '编辑器' },
      {
        type: 'p',
        text: '日常主力是 VS Code，开了 Vim 模式。插件控制在二十个以内，每半年清理一次没用的。字体用 JetBrains Mono，字号 14，行高 1.6。',
      },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "editor.fontFamily": "JetBrains Mono",
  "editor.fontSize": 14,
  "editor.lineHeight": 1.6,
  "editor.minimap.enabled": false,
  "workbench.startupEditor": "none"
}`,
      },
      { type: 'h2', id: 'hardware', text: '硬件' },
      {
        type: 'p',
        text: '一台 MacBook Pro，一块 27 寸 4K 显示器，一把 75% 配列的机械键盘，茶轴。桌上永远有一本纸质笔记本，画架构图的时候我还是更喜欢用笔。',
      },
    ],
  },
]

export function getAllPosts() {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug)
}

export function getAllTags() {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

export function getAdjacentPosts(slug: string) {
  const sorted = getAllPosts()
  const index = sorted.findIndex((post) => post.slug === slug)
  return {
    newer: index > 0 ? sorted[index - 1] : undefined,
    older: index < sorted.length - 1 ? sorted[index + 1] : undefined,
  }
}

export function getReadingMinutes(post: Post) {
  const chars = post.body.reduce((sum, block) => {
    if (block.type === 'ul') return sum + block.items.join('').length
    if (block.type === 'code') return sum + block.code.length / 2
    return sum + block.text.length
  }, 0)
  return Math.max(1, Math.round(chars / 400))
}

export type TreeDir = {
  name: string
  path: string
  dirs: TreeDir[]
  files: Post[]
  total: number
}

export function buildPostTree(list: Post[]): TreeDir {
  const root: TreeDir = { name: 'posts', path: '', dirs: [], files: [], total: 0 }

  for (const post of list) {
    let node = root
    node.total++
    for (const segment of post.dir.split('/').filter(Boolean)) {
      const path = node.path ? `${node.path}/${segment}` : segment
      let child = node.dirs.find((dir) => dir.name === segment)
      if (!child) {
        child = { name: segment, path, dirs: [], files: [], total: 0 }
        node.dirs.push(child)
      }
      child.total++
      node = child
    }
    node.files.push(post)
  }

  const sortTree = (node: TreeDir) => {
    node.dirs.sort((a, b) => a.name.localeCompare(b.name))
    node.files.sort((a, b) => b.date.localeCompare(a.date))
    node.dirs.forEach(sortTree)
  }
  sortTree(root)
  return root
}

export function getShortHash(slug: string) {
  let hash = 2166136261
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}
