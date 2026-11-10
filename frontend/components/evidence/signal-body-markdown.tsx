'use client'

import { forwardRef, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FIGURE_CAPTION_LINE } from '@/lib/evidence/archive-figures'
import { textFromMarkdownChildren } from '@/lib/evidence/markdown-children-text'

type SignalBodyMarkdownProps = {
  markdown: string
  className?: string
  /** 1-based figure index → data URL from GET /signals/{id}/figures */
  figureByIndex?: Record<number, string>
}

function FigureBlock({ src, caption }: { src?: string; caption: string }) {
  const safeSrc = typeof src === 'string' && src.trim().length > 0 ? src.trim() : null
  if (!safeSrc) {
    return (
      <blockquote className="evidence-figure-caption-only">
        <p>{caption}</p>
      </blockquote>
    )
  }
  return (
    <figure className="evidence-figure-block">
      <img src={safeSrc} alt="" loading="lazy" decoding="async" />
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

/** Render MarkItDown snapshot body as readable article text (not monospace pre). */
export const SignalBodyMarkdown = forwardRef<HTMLElement, SignalBodyMarkdownProps>(function SignalBodyMarkdown(
  { markdown, className, figureByIndex },
  ref,
) {
  const components = useMemo<Components>(() => {
    const figures = figureByIndex ?? {}
    return {
      img({ src, alt, ...props }) {
        const safeSrc = typeof src === 'string' && src.trim() ? src.trim() : undefined
        if (!safeSrc) return null
        return <img {...props} src={safeSrc} alt={alt ?? ''} loading="lazy" decoding="async" />
      },
      blockquote({ children, node: _node, ...props }) {
        const caption = textFromMarkdownChildren(children).trim()
        const match = FIGURE_CAPTION_LINE.exec(caption)
        if (match) {
          const index = Number(match[1])
          return <FigureBlock src={figures[index]} caption={caption} />
        }
        return <blockquote {...props}>{children}</blockquote>
      },
    }
  }, [figureByIndex])

  return (
    <article ref={ref} className={className ?? 'evidence-markdown-article'}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </article>
  )
})
