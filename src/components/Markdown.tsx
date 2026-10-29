import { useMemo } from 'react'
import { renderMarkdown } from '../lib/markdown'

export function Markdown({ content, className = '' }: { content: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(content), [content])
  return (
    <div
      className={`prose ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
