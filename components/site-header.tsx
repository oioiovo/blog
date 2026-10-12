import Link from 'next/link'
import { site } from '@/lib/site'
import { NavLinks } from '@/components/nav-links'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-5">
        <Link href="/" className="font-mono text-sm font-medium tracking-tight">
          <span className="text-muted-foreground">~/</span>
          {site.handle}
          <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-primary" />
        </Link>
        <NavLinks />
      </div>
    </header>
  )
}
