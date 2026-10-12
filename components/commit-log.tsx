import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getReadingMinutes, getShortHash, type Post } from '@/lib/posts'

export function CommitLog({ posts, showHead = true }: { posts: Post[]; showHead?: boolean }) {
  if (posts.length === 0) {
    return <p className="font-mono text-sm text-muted-foreground">{'没有找到匹配的提交。'}</p>
  }

  return (
    <ol className="flex flex-col">
      {posts.map((post, index) => {
        const isFirst = index === 0
        const isLast = index === posts.length - 1
        return (
          <li
            key={post.slug}
            className="group grid grid-cols-[1.25rem_1fr] gap-x-4 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="relative flex justify-center" aria-hidden="true">
              <span
                className={cn(
                  'absolute w-px bg-border',
                  isFirst ? 'top-2.5' : 'top-0',
                  isLast ? 'h-2.5' : 'bottom-0',
                )}
              />
              <span
                className={cn(
                  'relative mt-1.5 size-2.5 rounded-full border-2 border-primary transition-colors group-hover:bg-primary',
                  isFirst && showHead ? 'bg-primary' : 'bg-background',
                )}
              />
            </div>
            <Link href={`/posts/${post.slug}`} className="block rounded-md pb-9 outline-offset-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
                <span className="text-primary">{getShortHash(post.slug)}</span>
                {isFirst && showHead && (
                  <span className="rounded-sm bg-accent px-1.5 py-0.5 text-accent-foreground">
                    {'HEAD → main'}
                  </span>
                )}
                <time dateTime={post.date} className="text-muted-foreground">
                  {post.date}
                </time>
                <span className="text-muted-foreground">{`${getReadingMinutes(post)} 分钟`}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-snug text-balance transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">{post.summary}</p>
              <p className="mt-2.5 flex flex-wrap gap-x-3 font-mono text-xs text-muted-foreground">
                {post.tags.map((tag) => (
                  <span key={tag}>{`#${tag}`}</span>
                ))}
              </p>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
