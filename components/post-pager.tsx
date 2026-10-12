import Link from 'next/link'
import type { Post } from '@/lib/posts'

export function PostPager({ newer, older }: { newer?: Post; older?: Post }) {
  if (!newer && !older) return null

  return (
    <nav aria-label="上一篇和下一篇" className="grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
      {older ? (
        <Link href={`/posts/${older.slug}`} className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-4 hover:border-primary">
          <span className="font-mono text-xs text-muted-foreground">{'← 更早'}</span>
          <span className="text-sm font-medium text-balance group-hover:text-primary">{older.title}</span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {newer && (
        <Link
          href={`/posts/${newer.slug}`}
          className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-4 text-right hover:border-primary"
        >
          <span className="font-mono text-xs text-muted-foreground">{'更新 →'}</span>
          <span className="text-sm font-medium text-balance group-hover:text-primary">{newer.title}</span>
        </Link>
      )}
    </nav>
  )
}
