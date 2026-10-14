import type { Metadata } from 'next'
import Image from 'next/image'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import { PostBody } from '@/components/post-body'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: '关于',
  description: `关于${site.name}：经历、技术栈与联系方式。`,
}

export function generateStaticParams() {
  return [{}]
}

export default function AboutPage() {
  const raw = fs.readFileSync(path.join(process.cwd(), 'content/about.md'), 'utf8')
  const { content } = matter(raw)

  return (
    <div className="flex flex-col gap-10">
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
      </header>
      <PostBody content={content} />
    </div>
  )
}
