'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TocItem = { id: string; text: string }

function useActiveHeading(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null)

  useEffect(() => {
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (headings.length === 0) return

    const update = () => {
      // The active section is the last heading that has scrolled past the sticky header.
      const offset = 120
      let current = headings[0].id
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top - offset <= 0) current = heading.id
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      setActiveId(atBottom ? headings[headings.length - 1].id : current)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ids])

  return activeId
}

function TocList({ items, activeId }: { items: TocItem[]; activeId: string | null }) {
  return (
    <ol className="flex flex-col border-l border-border text-sm">
      {items.map((item, index) => {
        const active = item.id === activeId
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active ? 'location' : undefined}
              className={cn(
                '-ml-px flex gap-3 border-l-2 py-1.5 pl-4 leading-relaxed transition-colors',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              <span aria-hidden="true" className="font-mono text-xs leading-6 opacity-70">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-pretty">{item.text}</span>
            </a>
          </li>
        )
      })}
    </ol>
  )
}

/** 移动端：在文章内部展开的折叠目录 */
export function PostTocInline({ items }: { items: TocItem[] }) {
  const [ids] = useState(() => items.map((item) => item.id))
  const activeId = useActiveHeading(ids)
  if (items.length === 0) return null

  return (
    <details className="group rounded-lg border border-dashed border-border bg-card/60 xl:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 font-mono text-xs text-muted-foreground [&::-webkit-details-marker]:hidden">
        {`目录 · ${items.length} 节`}
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <nav aria-label="文章目录" className="px-5 pb-4">
        <TocList items={items} activeId={activeId} />
      </nav>
    </details>
  )
}

/** 桌面端：贴右栏的吸顶目录 */
export function PostTocAside({ items }: { items: TocItem[] }) {
  const [ids] = useState(() => items.map((item) => item.id))
  const activeId = useActiveHeading(ids)
  if (items.length === 0) return null

  return (
    <aside className="hidden xl:block">
      <nav aria-label="文章目录" className="sticky top-24 flex flex-col gap-4">
        <p className="font-mono text-xs text-muted-foreground">{'// 目录'}</p>
        <TocList items={items} activeId={activeId} />
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowUp className="size-3.5" aria-hidden="true" />
          {'回到顶部'}
        </button>
      </nav>
    </aside>
  )
}
