'use client'

import { useEffect, useRef } from 'react'

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function render() {
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({ startOnLoad: false, theme: 'neutral' })
      if (cancelled || !ref.current) return
      try {
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, chart)
        ref.current.innerHTML = svg
      } catch (e) {
        ref.current.innerHTML = `<pre class="text-red-500 text-xs">mermaid render error</pre>`
      }
    }
    render()
    return () => { cancelled = true }
  }, [chart])

  return <div ref={ref} className="my-4 overflow-x-auto rounded-lg border border-border bg-card p-4" />
}
