import type { Metadata } from 'next'
import Link from 'next/link'
import { GitCommitVertical } from 'lucide-react'
import { CommitLog } from '@/components/commit-log'
import { PostTree } from '@/components/post-tree'
import { buildPostTree, getAllPosts, getAllTags } from '@/lib/posts'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: '全部文章',
  description: '全部技术文章，可按时间线或目录结构浏览，并按标签筛选。',
}

function buildHref(tag?: string) {
  const query = new URLSearchParams()
  if (tag) query.set('tag', tag)
  const qs = query.toString()
  return qs ? `/posts?${qs}` : '/posts'
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; view?: string }>
}) {
  const { tag } = await searchParams
  const allPosts = getAllPosts()
  const tags = getAllTags()
  const posts = tag ? allPosts.filter((post) => post.tags.includes(tag)) : allPosts

  return (
    <div className="relative left-1/2 grid w-screen -translate-x-1/2 gap-8 px-5 md:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-14">
      <aside className="lg:sticky lg:top-24 lg:pl-0" aria-label="文章目录">
        <PostTree root={buildPostTree(allPosts)} />
      </aside>

      <main className="flex min-w-0 max-w-3xl flex-col gap-9">
        <header className="flex flex-col gap-3">
          <p className="font-mono text-xs text-muted-foreground">
            <span className="text-primary">{'$ '}</span>
            {tag ? `git log --grep="#${tag}"` : 'git log --all'}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{'全部文章'}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tag ? `标签「${tag}」下共 ${posts.length} 篇` : `共 ${allPosts.length} 篇，按时间倒序排列`}
          </p>
        </header>

        <nav aria-label="按标签筛选">
          <ul className="flex flex-wrap gap-2 font-mono text-xs">
            <li>
              <TagLink href={buildHref()} active={!tag} label="全部" count={allPosts.length} />
            </li>
            {tags.map(([name, count]) => (
              <li key={name}>
                <TagLink href={buildHref(name)} active={tag === name} label={`#${name}`} count={count} />
              </li>
            ))}
          </ul>
        </nav>

        <CommitLog key={tag ?? 'all'} posts={posts} showHead={!tag} />
      </main>
    </div>
  )
}

function ViewLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary',
      )}
    >
      {children}
    </Link>
  )
}

function TagLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary',
      )}
    >
      {label}
      <span className={active ? 'opacity-70' : 'opacity-60'}>{count}</span>
    </Link>
  )
}
