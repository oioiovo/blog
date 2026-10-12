import type { Block } from '@/lib/posts'

export function PostBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-5 text-base leading-loose">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'p':
            return (
              <p key={index} className="text-pretty">
                {block.text}
              </p>
            )
          case 'h2':
            return (
              <h2 key={index} id={block.id} className="group mt-6 scroll-mt-20 text-xl font-semibold tracking-tight">
                <a href={`#${block.id}`} className="flex items-baseline gap-2">
                  <span aria-hidden="true" className="font-mono text-sm text-primary/60 group-hover:text-primary">
                    {'##'}
                  </span>
                  {block.text}
                </a>
              </h2>
            )
          case 'code':
            return (
              <figure key={index} className="overflow-hidden rounded-lg border border-border bg-card">
                <figcaption className="border-b border-border bg-secondary px-4 py-1.5 font-mono text-xs text-muted-foreground">
                  {block.lang}
                </figcaption>
                <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
                  <code>{block.code}</code>
                </pre>
              </figure>
            )
          case 'ul':
            return (
              <ul key={index} className="flex flex-col gap-2">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="font-mono text-primary">
                      {'-'}
                    </span>
                    <span className="text-pretty">{item}</span>
                  </li>
                ))}
              </ul>
            )
          case 'quote':
            return (
              <blockquote key={index} className="my-2 border-l-2 border-accent py-1 pl-5 text-lg font-medium text-balance">
                {block.text}
              </blockquote>
            )
        }
      })}
    </div>
  )
}
