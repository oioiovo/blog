import { site } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 py-8 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {'© 2026 '}
          {site.name}
          {' · 用 Next.js 构建'}
        </p>
        <ul className="flex items-center gap-4">
          <li>
            <a href={site.github} target="_blank" rel="noreferrer" className="hover:text-primary">
              GitHub
            </a>
          </li>
          <li>
            <a href={site.twitter} target="_blank" rel="noreferrer" className="hover:text-primary">
              X / Twitter
            </a>
          </li>
          <li>
            <a href={`mailto:${site.email}`} className="hover:text-primary">
              Email
            </a>
          </li>
        </ul>
      </div>
    </footer>
  )
}
