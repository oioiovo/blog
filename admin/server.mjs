import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const POSTS_DIR = path.join(ROOT, 'content', 'posts')
const SITE_JSON = path.join(ROOT, 'config', 'site.json')
const PROJECTS_JSON = path.join(ROOT, 'config', 'projects.json')
const ABOUT_JSON = path.join(ROOT, 'config', 'about.json')

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(ROOT, 'public', 'images')))
app.use('/blog/images', express.static(path.join(ROOT, 'public', 'images')))

const IMAGES_DIR = path.join(ROOT, 'public', 'images')

// --- helpers ---
function normalizeDate(d) {
  if (!d) return ''
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)
}

function safeJoin(base, target) {
  const p = path.resolve(base, target)
  if (!p.startsWith(base)) throw new Error('path traversal')
  return p
}

function postFilePath(dir, slug) {
  const d = dir ? safeJoin(POSTS_DIR, dir) : POSTS_DIR
  return path.join(d, `${slug}.md`)
}

function readPost(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8')
  const { data, content } = matter(raw)
  return { ...data, date: normalizeDate(data.date), content: content.trim() }
}

function writePostFile(filepath, data) {
  const { title, summary, date, tags, dir, content } = data
  const fm = [
    '---',
    `title: ${title ?? ''}`,
    `summary: ${summary ?? ''}`,
    `date: ${date ?? new Date().toISOString().slice(0, 10)}`,
    `tags: ${JSON.stringify(tags ?? [])}`,
    `dir: ${dir ?? ''}`,
    '---', '', content ?? ''
  ].join('\n')
  fs.mkdirSync(path.dirname(filepath), { recursive: true })
  fs.writeFileSync(filepath, fm)
}

// --- walk filesystem tree ---
function walkDir(relPath) {
  const absDir = relPath ? safeJoin(POSTS_DIR, relPath) : POSTS_DIR
  if (!fs.existsSync(absDir)) return { dirs: [], files: [] }
  const entries = fs.readdirSync(absDir, { withFileTypes: true })
  const dirs = []
  const files = []
  for (const e of entries) {
    if (e.name.startsWith('.')) continue
    const childRel = relPath ? `${relPath}/${e.name}` : e.name
    if (e.isDirectory()) {
      dirs.push({ name: e.name, path: childRel, ...walkDir(childRel) })
    } else if (e.name.endsWith('.md')) {
      const full = path.join(absDir, e.name)
      const post = readPost(full)
      const fileSlug = e.name.replace(/\.md$/, '')
      files.push({ fileSlug, ...post, slug: post.slug || fileSlug, dir: relPath })
    }
  }
  dirs.sort((a, b) => a.name.localeCompare(b.name))
  files.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  return { dirs, files }
}

// === APIs ===

// Site config
app.get('/api/site', (req, res) => res.json(JSON.parse(fs.readFileSync(SITE_JSON, 'utf8'))))
app.put('/api/site', (req, res) => {
  fs.writeFileSync(SITE_JSON, JSON.stringify(req.body, null, 2) + '\n')
  res.json({ ok: true })
})

// Projects
app.get('/api/projects', (req, res) => res.json(JSON.parse(fs.readFileSync(PROJECTS_JSON, 'utf8'))))
app.put('/api/projects', (req, res) => {
  fs.writeFileSync(PROJECTS_JSON, JSON.stringify(req.body, null, 2) + '\n')
  res.json({ ok: true })
})

const ABOUT_MD = path.join(ROOT, 'content', 'README.md')

// About page markdown
app.get('/api/about', (req, res) => {
  res.type('text/plain').send(fs.readFileSync(ABOUT_MD, 'utf8'))
})
app.put('/api/about', (req, res) => {
  fs.writeFileSync(ABOUT_MD, req.body.content)
  res.json({ ok: true })
})

// About page structured config (stack, experience)
app.get('/api/about-json', (req, res) => res.json(JSON.parse(fs.readFileSync(ABOUT_JSON, 'utf8'))))
app.put('/api/about-json', (req, res) => {
  fs.writeFileSync(ABOUT_JSON, JSON.stringify(req.body, null, 2) + '\n')
  res.json({ ok: true })
})

// Image upload
app.get('/api/images', (req, res) => {
  if (!fs.existsSync(IMAGES_DIR)) return res.json([])
  const files = fs.readdirSync(IMAGES_DIR).filter(f => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f))
  res.json(files.map(name => ({ name, url: `/blog/images/${name}` })))
})

app.post('/api/images', express.raw({ type: 'image/*', limit: '10mb' }), (req, res) => {
  const name = req.query.name
  if (!name || !/^[\w.-]+\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)) {
    return res.status(400).json({ error: 'invalid filename' })
  }
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true })
  fs.writeFileSync(path.join(IMAGES_DIR, name), req.body)
  res.json({ ok: true, url: `/blog/images/${name}` })
})

app.delete('/api/images/:name', (req, res) => {
  const name = req.params.name
  if (!/^[\w.-]+\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)) {
    return res.status(400).json({ error: 'invalid filename' })
  }
  const p = path.join(IMAGES_DIR, name)
  if (fs.existsSync(p)) fs.unlinkSync(p)
  res.json({ ok: true })
})

// Tree
app.get('/api/tree', (req, res) => {
  res.json(walkDir(''))
})

// Create directory
app.post('/api/dirs', (req, res) => {
  const { path: dirPath } = req.body
  if (!dirPath) return res.status(400).json({ error: 'path required' })
  const abs = safeJoin(POSTS_DIR, dirPath)
  fs.mkdirSync(abs, { recursive: true })
  res.json({ ok: true })
})

// Rename directory
app.put('/api/dirs', (req, res) => {
  const { oldPath, newPath } = req.body
  if (!oldPath || !newPath) return res.status(400).json({ error: 'oldPath and newPath required' })
  const oldAbs = safeJoin(POSTS_DIR, oldPath)
  const newAbs = safeJoin(POSTS_DIR, newPath)
  if (!fs.existsSync(oldAbs)) return res.status(404).json({ error: 'not found' })
  fs.mkdirSync(path.dirname(newAbs), { recursive: true })
  fs.renameSync(oldAbs, newAbs)
  // Update dir field in all moved .md files
  function updateDirField(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) updateDirField(full)
      else if (e.name.endsWith('.md')) {
        const rel = path.relative(POSTS_DIR, path.dirname(full)).replace(/\\/g, '/')
        const post = readPost(full)
        writePostFile(full, { ...post, dir: rel })
      }
    }
  }
  updateDirField(newAbs)
  res.json({ ok: true })
})

// Delete directory
app.delete('/api/dirs', (req, res) => {
  const { path: dirPath } = req.body
  if (!dirPath) return res.status(400).json({ error: 'path required' })
  const abs = safeJoin(POSTS_DIR, dirPath)
  if (!fs.existsSync(abs)) return res.status(404).json({ error: 'not found' })
  fs.rmSync(abs, { recursive: true })
  res.json({ ok: true })
})

// Get single post
app.get(/^\/api\/posts\/(.+)$/, (req, res) => {
  try {
    const full = req.params[0]
    const parts = full.split('/')
    const slug = parts.pop()
    const dir = parts.join('/')
    const fp = postFilePath(dir, slug)
    if (!fs.existsSync(fp)) return res.status(404).json({ error: 'not found: ' + fp })
    res.json({ slug, dir, ...readPost(fp) })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// Create post
app.post('/api/posts', (req, res) => {
  try {
    const { slug, dir, ...data } = req.body
    if (!slug) return res.status(400).json({ error: 'slug required' })
    const fp = postFilePath(dir, slug)
    if (fs.existsSync(fp)) return res.status(409).json({ error: 'already exists' })
    writePostFile(fp, { ...data, slug, dir })
    res.json({ ok: true, slug, dir })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// Update post
app.put(/^\/api\/posts\/(.+)$/, (req, res) => {
  try {
    const full = req.params[0]
    const parts = full.split('/')
    const oldSlug = parts.pop()
    const oldDir = parts.join('/')
    const { slug, dir, ...data } = req.body
    const oldFp = postFilePath(oldDir, oldSlug)
    if (!fs.existsSync(oldFp)) return res.status(404).json({ error: 'not found' })
    const newFp = postFilePath(dir, slug)
    writePostFile(newFp, { ...data, slug, dir })
    if (newFp !== oldFp) fs.unlinkSync(oldFp)
    res.json({ ok: true, slug, dir })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// Delete post
app.delete(/^\/api\/posts\/(.+)$/, (req, res) => {
  try {
    const full = req.params[0]
    const parts = full.split('/')
    const slug = parts.pop()
    const dir = parts.join('/')
    const fp = postFilePath(dir, slug)
    if (!fs.existsSync(fp)) return res.status(404).json({ error: 'not found' })
    fs.unlinkSync(fp)
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// Only track blog content + site config for publish
const TRACKED = ['content/posts/', 'content/README.md', 'config/', 'lib/', 'app/', 'components/', 'public/images/']
function trackedStatus() {
  const git = (args) => execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] })
  const all = git('status --porcelain').trim()
  if (!all) return []
  return all.split('\n').filter(line => {
    let path = line.slice(3).trim().replace(/^"|"$/g, '')
    return TRACKED.some(p => path.startsWith(p))
  })
}

// Publish
app.post('/api/publish', (req, res) => {
  try {
    const git = (args) => execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] })
    const changed = trackedStatus()
    if (!changed.length) return res.json({ ok: true, message: '没有需要发布的改动' })
    const stamp = new Date().toLocaleString('zh-CN', { hour12: false })
    for (const p of TRACKED) git(`add ${p}`)
    git(`commit -m "chore: publish ${changed.length} file(s) at ${stamp}"`)
    git('push origin main')
    res.json({ ok: true, message: `已提交并推送 ${changed.length} 个文件` })
  } catch (e) {
    res.status(500).json({ error: e.stderr?.toString()?.trim() || e.message })
  }
})

app.get('/api/git-status', (req, res) => {
  try {
    const changed = trackedStatus()
    res.json({ dirty: changed.length > 0, changed: changed.length })
  } catch (e) {
    res.json({ dirty: false, changed: 0 })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`\n  博客管理后台: http://localhost:${PORT}\n`)
})
