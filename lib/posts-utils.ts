export function getShortHash(slug: string): string {
  let hash = 2166136261
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

export function getReadingMinutes(content: string): number {
  const chars = content.replace(/```[\s\S]*?```/g, '').length
  return Math.max(1, Math.round(chars / 400))
}

export type TocHeading = { id: string; text: string }

/** Extract h2 headings from markdown content for TOC */
export function extractToc(content: string): TocHeading[] {
  const headings: TocHeading[] = []
  const lines = content.split('\n')
  let inCodeBlock = false
  for (const line of lines) {
    if (line.trim().startsWith('```')) inCodeBlock = !inCodeBlock
    if (inCodeBlock) continue
    const match = line.match(/^##\s+(.+)$/)
    if (match) {
      const text = match[1].trim()
      headings.push({ id: getShortHash(text), text })
    }
  }
  return headings
}
