import type { Metadata } from 'next'
import Image from 'next/image'
import { SectionHeading } from '@/components/section-heading'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: '关于',
  description: `关于${site.name}：经历、技术栈与联系方式。`,
}

const stack = [
  { group: '语言', items: 'TypeScript · Rust · Go · SQL' },
  { group: '前端', items: 'React · Next.js · Tailwind CSS' },
  { group: '后端', items: 'Node.js · PostgreSQL · Redis' },
  { group: '基础设施', items: 'Vercel · Docker · GitHub Actions' },
]

const experience = [
  { period: '2023 — 至今', role: '高级工程师 · 基础架构', org: '某 SaaS 公司' },
  { period: '2020 — 2023', role: '全栈工程师', org: '某电商创业团队' },
  { period: '2018 — 2020', role: '前端工程师', org: '某互联网公司' },
]

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-16">
      <header className="flex flex-col gap-6">
        <p className="font-mono text-xs text-muted-foreground">
          <span className="text-primary">{'$ '}</span>
          {'cat README.md'}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{'关于我'}</h1>
        <div className="overflow-hidden rounded-lg border border-border">
          <Image
            src="/images/desk.png"
            alt="摆着机械键盘、手绘架构图笔记本和一杯茶的书桌"
            width={1200}
            height={800}
            className="aspect-[16/9] w-full object-cover"
            priority
          />
        </div>
        <div className="flex flex-col gap-4 text-base leading-loose">
          <p className="text-pretty">
            {`我是${site.name}，一名有八年经验的全栈开发者。从切图写 jQuery 开始，一路做到现在负责团队的部署平台和数据层。`}
          </p>
          <p className="text-pretty">
            {
              '我相信好的软件来自对细节的耐心：一个更准确的类型、一条更合适的索引、一个少 100ms 的首屏。写博客是我整理思路的方式——如果一件事讲不清楚，通常说明我还没真正理解它。'
            }
          </p>
        </div>
      </header>

      <section>
        <SectionHeading command="cat stack.toml" title="技术栈" />
        <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {stack.map((item) => (
            <div key={item.group} className="flex flex-col gap-1 bg-card p-4">
              <dt className="font-mono text-xs text-muted-foreground">{item.group}</dt>
              <dd className="text-sm">{item.items}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <SectionHeading command="history | tail -3" title="经历" />
        <ol className="flex flex-col divide-y divide-border border-y border-border">
          {experience.map((item) => (
            <li key={item.period} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">{item.period}</span>
              <span className="text-sm">
                <span className="font-medium">{item.role}</span>
                <span className="text-muted-foreground">{` · ${item.org}`}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <SectionHeading command="ping oioiovo" title="联系我" />
        <p className="text-base leading-relaxed text-muted-foreground text-pretty">
          {'欢迎来信讨论技术问题、合作机会，或者只是打个招呼。我通常会在一周内回复。'}
        </p>
        <a
          href={`mailto:${site.email}`}
          className="mt-5 inline-flex items-center rounded-md bg-primary px-4 py-2 font-mono text-sm text-primary-foreground hover:opacity-90"
        >
          {site.email}
        </a>
      </section>
    </div>
  )
}
