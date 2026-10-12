import Link from 'next/link'
import { ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react'
import { DIR_LABELS, type Post, type TreeDir } from '@/lib/posts'

function countDirs(dir: TreeDir): number {
  return dir.dirs.reduce((sum, child) => sum + 1 + countDirs(child), 0)
}

export function PostTree({ root }: { root: TreeDir }) {
  return (
    <div className="flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-xl border border-border/80 bg-card/80 font-mono text-sm shadow-sm">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-secondary/30 px-3.5 py-3 text-[11px] text-muted-foreground">
        <span>{'~/blog/posts'}</span>
        <span>{`${countDirs(root)} 个目录，${root.total} 篇文章`}</span>
      </div>

      {root.total === 0 ? (
        <p className="px-4 py-8 text-center font-sans text-sm text-muted-foreground">{'这个目录下还没有文章。'}</p>
      ) : (
        <div className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto p-2">
          <p className="flex items-center gap-2 rounded-md px-2 py-1.5 text-foreground">
            <FolderOpen className="size-4 text-primary" aria-hidden="true" />
            {'posts/'}
          </p>
          <TreeChildren dir={root} />
        </div>
      )}
    </div>
  )
}

function TreeChildren({ dir }: { dir: TreeDir }) {
  return (
    <ul className="ml-4 min-w-0 max-w-full overflow-hidden border-l border-dashed border-border pl-2">
      {dir.dirs.map((child) => (
        <DirNode key={child.path} dir={child} />
      ))}
      {dir.files.map((post) => (
        <FileNode key={post.slug} post={post} />
      ))}
    </ul>
  )
}

function DirNode({ dir }: { dir: TreeDir }) {
  const label = DIR_LABELS[dir.path]

  return (
    <li>
      <details open className="tree-dir min-w-0 max-w-full overflow-hidden">
        <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 transition-colors hover:bg-secondary [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="tree-chevron size-3.5 shrink-0 text-muted-foreground transition-transform"
            aria-hidden="true"
          />
          <Folder className="tree-folder-closed size-4 shrink-0 text-primary" aria-hidden="true" />
          <FolderOpen className="tree-folder-open size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 truncate text-foreground">{`${dir.name}/`}</span>
          {label && <span className="min-w-0 truncate font-sans text-xs text-muted-foreground">{label}</span>}
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {dir.total}
            <span className="sr-only">{' 篇文章'}</span>
          </span>
        </summary>
        <TreeChildren dir={dir} />
      </details>
    </li>
  )
}

function FileNode({ post }: { post: Post }) {
  return (
    <li>
      <Link
        href={`/posts/${post.slug}`}
        title={`${post.title} · ${post.date}`}
        className="group flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 transition-colors hover:bg-secondary"
      >
        <FileText
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-foreground/90 transition-colors group-hover:text-primary">
          {`${post.slug}.md`}
        </span>
        <time dateTime={post.date} className="hidden w-[5.25rem] shrink-0 text-right text-[10px] text-muted-foreground lg:block">
          {post.date}
        </time>
      </Link>
    </li>
  )
}
