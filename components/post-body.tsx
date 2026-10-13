import ReactMarkdown from 'react-markdown'
import { Mermaid } from './mermaid'
import { getShortHash } from '@/lib/posts-utils'

export function PostBody({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-5 text-base leading-loose">
      <ReactMarkdown
        components={{
          h2: ({ children }) => {
            const text = String(children)
            const id = getShortHash(text)
            return (
              <h2 id={id} className="group mt-6 scroll-mt-20 text-xl font-semibold tracking-tight">
                <a href={`#${id}`} className="flex items-baseline gap-2">
                  <span aria-hidden="true" className="font-mono text-sm text-primary/60 group-hover:text-primary">
                    {'##'}
                  </span>
                  {children}
                </a>
              </h2>
            )
          },
          p: ({ children }) => <p className="text-pretty">{children}</p>,
          ul: ({ children }) => <ul className="flex flex-col gap-2">{children}</ul>,
          li: ({ children }) => (
            <li className="flex gap-3">
              <span aria-hidden="true" className="font-mono text-primary">
                {'-'}
              </span>
              <span className="text-pretty">{children}</span>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-accent py-1 pl-5 text-lg font-medium text-balance">
              {children}
            </blockquote>
          ),
          pre: ({ children }) => {
            const codeEl = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>
            const className = codeEl?.props?.className ?? ''
            const lang = className.replace('language-', '')
            const code = String(codeEl?.props?.children ?? '')

            if (lang === 'mermaid') {
              return <Mermaid chart={code} />
            }

            return (
              <figure className="overflow-hidden rounded-lg border border-border bg-card">
                <figcaption className="border-b border-border bg-secondary px-4 py-1.5 font-mono text-xs text-muted-foreground">
                  {lang}
                </figcaption>
                <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">{children}</pre>
              </figure>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
