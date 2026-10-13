import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { CommitLog } from '@/components/commit-log'
import { SectionHeading } from '@/components/section-heading'
import { getAllPosts } from '@/lib/posts'
import { projects, site } from '@/lib/site'

async function enrichProjects() {
  return Promise.all(
    projects.map(async (p) => {
      const m = p.href?.match(/github\.com[\/:]([^\/]+)\/([^\/\s]+?)(?:\.git)?$/)
      if (!m) return p
      try {
        const r = await fetch(`https://api.github.com/repos/${m[1]}/${m[2]}`, { next: { revalidate: 3600 } })
        if (!r.ok) return p
        const d = await r.json()
        return { ...p, name: d.name || p.name, description: d.description || p.description, meta: `★ ${d.stargazers_count}` }
      } catch { return p }
    })
  )
}

export default async function HomePage() {
  const posts = getAllPosts()
  const enrichedProjects = await enrichProjects()

  return (
    <div className="flex flex-col gap-20">
      <section className="flex flex-col gap-6 pt-4">
        <p className="font-mono text-xs text-muted-foreground">
          <span className="text-primary">{'$ '}</span>
          {'whoami'}
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-balance md:text-5xl">
          {'你好，我是'}
          {site.name}
          {'。'}
          <br />
          <span className="text-muted-foreground">{site.tagline}</span>
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
          {site.bio}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <Link href="/posts" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
            {'阅读文章'}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            {'关于我'}
          </Link>
        </div>
      </section>

      <section aria-labelledby="recent-heading">
        <div id="recent-heading">
          <SectionHeading command="git log --graph -n 4" title="最近的文章" />
        </div>
        <CommitLog posts={posts.slice(0, 4)} />
        <Link
          href="/posts"
          className="ml-9 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary"
        >
          {`查看全部 ${posts.length} 篇文章`}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </section>

      <section aria-labelledby="projects-heading">
        <div id="projects-heading">
          <SectionHeading command="ls ~/projects" title="开源项目" />
        </div>
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {enrichedProjects.map((project) => (
            <li key={project.name}>
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start justify-between gap-4 py-5"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-sm font-medium transition-colors group-hover:text-primary">
                    {project.name}
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground text-pretty">
                    {project.description}
                  </span>
                  {project.showStars !== false && project.meta && (
                    <span className="font-mono text-xs text-muted-foreground">{project.meta}</span>
                  )}
                </div>
                <ArrowUpRight
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
