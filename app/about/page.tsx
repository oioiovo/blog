import type { Metadata } from 'next'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import { PostBody } from '@/components/post-body'
import { site, about } from '@/lib/site'
import { SectionHeading } from '@/components/section-heading'

export const metadata: Metadata = {
  title: '关于',
  description: `关于${site.name}：经历、技术栈与联系方式。`,
}

export function generateStaticParams() {
  return [{}]
}

export default function AboutPage() {
  const raw = fs.readFileSync(path.join(process.cwd(), 'content/README.md'), 'utf8')
  const { content } = matter(raw)

  return (
    <div className="flex flex-col gap-16">
      <header className="flex flex-col gap-6">
        <p className="font-mono text-xs text-muted-foreground">
          <span className="text-primary">{'$ '}</span>
          {'cat README.md'}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{'关于我'}</h1>
        <PostBody content={content} />
      </header>

      <section>
        <SectionHeading command="cat stack.toml" title="技术栈" />
        <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {about.stack.map((item) => (
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
          {about.experience.map((item) => (
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
