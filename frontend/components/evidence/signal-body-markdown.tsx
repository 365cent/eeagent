'use client'

import { forwardRef, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FIGURE_CAPTION_LINE } from '@/lib/evidence/archive-figures'
import { textFromMarkdownChildren } from '@/lib/evidence/markdown-children-text'
import {
  isFailedFigureCaption,
  sanitizeSnapshotMarkdown,
} from '@/lib/evidence/sanitize-snapshot-markdown'
import {
  sanitizeMarkdownUrl,
  sanitizeMarkdownUrlsInText,
  shortenLinkLabel,
} from '@/lib/evidence/sanitize-markdown-url'
import { textFromMarkdownChildren as childrenToText } from '@/lib/evidence/markdown-children-text'

type SignalBodyMarkdownProps = {
  markdown: string
  className?: string
  /** 1-based figure index → data URL from GET /signals/{id}/figures */
  figureByIndex?: Record<number, string>
}

/** A figure note is a sentence or two; anything longer is stray body text. */
const MAX_CAPTION_CHARS = 180

function splitFigureCaption(caption: string): { label: string; text: string } {
  const match = FIGURE_CAPTION_LINE.exec(caption.trim())
  const label = match ? `图 ${match[1]}` : ''
  const raw = (match ? (match[2] ?? '') : caption).trim()
  if (raw.length <= MAX_CAPTION_CHARS) return { label, text: raw }
  // Cut on a sentence end when one is available, never mid-word.
  const window = raw.slice(0, MAX_CAPTION_CHARS + 40)
  const stop = Math.max(window.lastIndexOf('。'), window.lastIndexOf('；'), window.lastIndexOf('. '))
  const text = stop > 40 ? window.slice(0, stop + 1) : `${raw.slice(0, MAX_CAPTION_CHARS)}…`
  return { label, text }
}

/** Figure caption attached to its image: small label plus a readable note. */
function FigureCaption({ caption }: { caption: string }) {
  const { label, text } = splitFigureCaption(caption)
  const failed = isFailedFigureCaption(caption) || !text
  return (
    <figcaption className={`evidence-figure-caption${failed ? ' is-pending' : ''}`}>
      {label ? <span className="evidence-figure-label">{label}</span> : null}
      <span className="evidence-figure-text" title={failed ? undefined : caption}>
        {failed ? '图像描述待生成' : text}
      </span>
    </figcaption>
  )
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
      <div className="evidence-figure-frame">
        <img src={safeSrc} alt="" loading="lazy" decoding="async" />
      </div>
      <FigureCaption caption={caption} />
    </figure>
  )
}

/** Render MarkItDown snapshot body as readable article text (not monospace pre). */
export const SignalBodyMarkdown = forwardRef<HTMLElement, SignalBodyMarkdownProps>(function SignalBodyMarkdown(
  { markdown, className, figureByIndex },
  ref,
) {  const renderedMarkdown = useMemo(
    () => sanitizeMarkdownUrlsInText(sanitizeSnapshotMarkdown(markdown)),
    [markdown],
  )

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
      table({ children, node: _node, ...props }) {
        return (
          <div className="markdown-table-scroll">
            <table {...props}>{children}</table>
          </div>
        )
      },
      a({ href, children, ...props }) {
        const safe = href ? sanitizeMarkdownUrl(href) : undefined
        if (!safe) {
          return <span>{children}</span>
        }
        const label = shortenLinkLabel(safe, childrenToText(children).trim() || safe)
        return (
          <a href={safe} target="_blank" rel="noopener noreferrer" {...props}>
            {label || safe}
          </a>
        )
      },
    }
  }, [figureByIndex])

  return (
    <article ref={ref} className={className ?? 'evidence-markdown-article'}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {renderedMarkdown}
      </ReactMarkdown>
    </article>
  )
})
