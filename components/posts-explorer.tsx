'use client'

import { useState } from 'react'
import { CommitLog } from '@/components/commit-log'
import type { Post } from '@/lib/posts'
import { cn } from '@/lib/utils'

type Tag = { name: string; count: number }

export function PostsExplorer({ posts, tags }: { posts: Post[]; tags: Tag[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const filtered = activeTag ? posts.filter((p) => p.tags.includes(activeTag)) : posts

  return (
    <main className="flex min-w-0 max-w-3xl flex-col gap-9">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs text-muted-foreground">
          <span className="text-primary">{'$ '}</span>
          {activeTag ? `git log --grep="#${activeTag}"` : 'git log --all'}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{'全部文章'}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {activeTag
            ? `标签「${activeTag}」下共 ${filtered.length} 篇`
            : `共 ${posts.length} 篇，按时间倒序排列`}
        </p>
      </header>

      <nav aria-label="按标签筛选">
        <ul className="flex flex-wrap gap-2 font-mono text-xs">
          <li>
            <TagButton active={activeTag === null} label="全部" count={posts.length} onClick={() => setActiveTag(null)} />
          </li>
          {tags.map(({ name, count }) => (
            <li key={name}>
              <TagButton
                active={activeTag === name}
                label={`#${name}`}
                count={count}
                onClick={() => setActiveTag(name === activeTag ? null : name)}
              />
            </li>
          ))}
        </ul>
      </nav>

      <CommitLog key={activeTag ?? 'all'} posts={filtered} showHead={activeTag === null} />
    </main>
  )
}

function TagButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary',
      )}
    >
      {label}
      <span className={active ? 'opacity-70' : 'opacity-60'}>{count}</span>
    </button>
  )
}
