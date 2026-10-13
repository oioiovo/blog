import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { getReadingMinutes, getShortHash, extractToc, type TocHeading } from './posts-utils'

export type Post = {
  slug: string
  title: string
  summary: string
  date: string
  tags: string[]
  dir: string
  content: string
}

export type { TocHeading }
export { getShortHash, getReadingMinutes, extractToc }

export const DIR_LABELS: Record<string, string> = {
  frontend: '前端',
  'frontend/react': 'React 生态',
  'frontend/typescript': '类型系统',
  backend: '后端',
  'backend/database': '数据库',
  'backend/architecture': '架构与部署',
  tools: '工具',
  'tools/rust': 'Rust',
  notes: '随笔',
}

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

function findAllMdFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  let results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results = results.concat(findAllMdFiles(full))
    } else if (entry.name.endsWith('.md')) {
      results.push(full)
    }
  }
  return results
}

function parsePost(filepath: string): Post {
  const raw = fs.readFileSync(filepath, 'utf8')
  const { data, content } = matter(raw)
  // slug: use frontmatter slug if set, otherwise derive from filename (ASCII fallback)
  const fileSlug = path.basename(filepath).replace(/\.md$/, '')
  const slug = data.slug || fileSlug.toLowerCase().replace(/\s+/g, '-')
  // dir is the relative path from POSTS_DIR, without filename
  const rel = path.relative(POSTS_DIR, path.dirname(filepath)).replace(/\\/g, '/')
  return {
    slug,
    title: data.title ?? fileSlug,
    summary: data.summary ?? '',
    date: data.date ? new Date(data.date).toISOString().slice(0, 10) : '',
    tags: data.tags ?? [],
    dir: data.dir ?? (rel === '.' ? '' : rel),
    content: content.trim(),
  }
}

export function getAllPosts(): Post[] {
  const files = findAllMdFiles(POSTS_DIR)
  return files.map(parsePost).sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

export function getAllTags(): [string, number][] {
  const counts = new Map<string, number>()
  for (const post of getAllPosts()) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

export function getAdjacentPosts(slug: string) {
  const sorted = getAllPosts()
  const index = sorted.findIndex((p) => p.slug === slug)
  return {
    newer: index > 0 ? sorted[index - 1] : undefined,
    older: index < sorted.length - 1 ? sorted[index + 1] : undefined,
  }
}

export type TreeDir = {
  name: string
  path: string
  dirs: TreeDir[]
  files: Post[]
  total: number
}

export function buildPostTree(list: Post[]): TreeDir {
  const root: TreeDir = { name: 'posts', path: '', dirs: [], files: [], total: 0 }

  for (const post of list) {
    let node = root
    node.total++
    for (const segment of post.dir.split('/').filter(Boolean)) {
      const path = node.path ? `${node.path}/${segment}` : segment
      let child = node.dirs.find((dir) => dir.name === segment)
      if (!child) {
        child = { name: segment, path, dirs: [], files: [], total: 0 }
        node.dirs.push(child)
      }
      child.total++
      node = child
    }
    node.files.push(post)
  }

  const sortTree = (node: TreeDir) => {
    node.dirs.sort((a, b) => a.name.localeCompare(b.name))
    node.files.sort((a, b) => b.date.localeCompare(a.date))
    node.dirs.forEach(sortTree)
  }
  sortTree(root)
  return root
}
