import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const POSTS_DIR = path.join(ROOT, 'content', 'posts')
const SITE_JSON = path.join(ROOT, 'config', 'site.json')
const PROJECTS_JSON = path.join(ROOT, 'config', 'projects.json')

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// --- Site config ---
app.get('/api/site', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(SITE_JSON, 'utf8')))
})

app.put('/api/site', (req, res) => {
  fs.writeFileSync(SITE_JSON, JSON.stringify(req.body, null, 2) + '\n')
  res.json({ ok: true })
})

// --- Projects ---
app.get('/api/projects', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(PROJECTS_JSON, 'utf8')))
})

app.put('/api/projects', (req, res) => {
  fs.writeFileSync(PROJECTS_JSON, JSON.stringify(req.body, null, 2) + '\n')
  res.json({ ok: true })
})

// --- Posts ---
function readPost(slug) {
  const filepath = path.join(POSTS_DIR, `${slug}.md`)
  if (!fs.existsSync(filepath)) return null
  const raw = fs.readFileSync(filepath, 'utf8')
  const { data, content } = matter(raw)
  return { slug, ...data, date: normalizeDate(data.date), content: content.trim() }
}

function normalizeDate(d) {
  if (!d) return ''
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d)
}

app.get('/api/posts', (req, res) => {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'))
  const posts = files.map((f) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8')
    const { data } = matter(raw)
    return { slug: f.replace(/\.md$/, ''), ...data, date: normalizeDate(data.date) }
  })
  posts.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  res.json(posts)
})

app.get('/api/posts/:slug', (req, res) => {
  const post = readPost(req.params.slug)
  if (!post) return res.status(404).json({ error: 'not found' })
  res.json(post)
})

app.post('/api/posts', (req, res) => {
  const { slug, title, summary, date, tags, dir, content } = req.body
  if (!slug || !title) return res.status(400).json({ error: 'slug and title required' })
  const filepath = path.join(POSTS_DIR, `${slug}.md`)
  if (fs.existsSync(filepath)) return res.status(409).json({ error: 'already exists' })
  const fm = ['---', `slug: ${slug}`, `title: ${title}`, `summary: ${summary ?? ''}`, `date: ${date ?? new Date().toISOString().slice(0, 10)}`, `tags: ${JSON.stringify(tags ?? [])}`, `dir: ${dir ?? 'notes'}`, '---', '', content ?? ''].join('\n')
  fs.writeFileSync(filepath, fm)
  res.json({ ok: true, slug })
})

app.put('/api/posts/:slug', (req, res) => {
  const oldSlug = req.params.slug
  const { slug, title, summary, date, tags, dir, content } = req.body
  const oldPath = path.join(POSTS_DIR, `${oldSlug}.md`)
  if (!fs.existsSync(oldPath)) return res.status(404).json({ error: 'not found' })
  const fm = ['---', `slug: ${slug}`, `title: ${title}`, `summary: ${summary ?? ''}`, `date: ${date}`, `tags: ${JSON.stringify(tags ?? [])}`, `dir: ${dir ?? 'notes'}`, '---', '', content ?? ''].join('\n')
  const newPath = path.join(POSTS_DIR, `${slug}.md`)
  fs.writeFileSync(newPath, fm)
  if (slug !== oldSlug) fs.unlinkSync(oldPath)
  res.json({ ok: true, slug })
})

app.delete('/api/posts/:slug', (req, res) => {
  const filepath = path.join(POSTS_DIR, `${req.params.slug}.md`)
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'not found' })
  fs.unlinkSync(filepath)
  res.json({ ok: true })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`\n  博客管理后台: http://localhost:${PORT}\n`)
})
