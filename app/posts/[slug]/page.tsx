import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PostBody } from '@/components/post-body'
import { PostPager } from '@/components/post-pager'
import { PostToc } from '@/components/post-toc'
import { PostTree } from '@/components/post-tree'
import {
  buildPostTree,
  getAdjacentPosts,
  getAllPosts,
  getPostBySlug,
  getReadingMinutes,
  getShortHash,
} from '@/lib/posts'

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.summary,
    openGraph: { title: post.title, description: post.summary, type: 'article', publishedTime: post.date },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const { newer, older } = getAdjacentPosts(slug)
  const toc = post.body.flatMap((block) => (block.type === 'h2' ? [block] : []))
  const tree = buildPostTree(getAllPosts())

  return (
    <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,760px)] xl:items-start xl:gap-12">
      <aside aria-label="文章目录" className="order-2 min-w-0 xl:order-1 xl:sticky xl:top-24">
        <PostTree root={tree} />
      </aside>
      <article className="order-1 min-w-0 max-w-[760px] xl:order-2">
      <header className="flex flex-col gap-5">
        <Link
          href="/posts"
          className="inline-flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {'返回文章列表'}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
          <span className="text-primary">{`commit ${getShortHash(post.slug)}`}</span>
          <time dateTime={post.date}>{post.date}</time>
          <span>{`约 ${getReadingMinutes(post)} 分钟阅读`}</span>
        </div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-balance md:text-4xl">{post.title}</h1>
        <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{post.summary}</p>
        <ul className="flex flex-wrap gap-2 font-mono text-xs">
          {post.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/posts?tag=${encodeURIComponent(tag)}`}
                className="rounded-md border border-border bg-card px-2.5 py-1 text-muted-foreground hover:border-primary hover:text-primary"
              >
                {`#${tag}`}
              </Link>
            </li>
          ))}
        </ul>
      </header>

      <div className="relative flex flex-col gap-10">
        <PostToc items={toc.map(({ id, text }) => ({ id, text }))} />
        <PostBody blocks={post.body} />
      </div>

      <PostPager newer={newer} older={older} />
      </article>
    </div>
  )
}
