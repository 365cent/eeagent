'use client'

import { createContext, forwardRef, memo, useContext, useMemo } from 'react'
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

type SignalBodyMarkdownProps = {
  markdown: string
  className?: string
  /** 1-based figure index → data URL from GET /signals/{id}/figures */
  figureByIndex?: Record<number, string>
}

/** A figure note is a sentence or two; anything longer is stray body text. */
const MAX_CAPTION_CHARS = 180

const REMARK_PLUGINS = [remarkGfm]
const EMPTY_FIGURE_IMAGES: Record<number, string> = {}

/**
 * Figure URLs travel through context instead of the component map: caption
 * repairs then repaint only the figures, and the parsed article is not rebuilt.
 */
const FigureImagesContext = createContext<Record<number, string>>(EMPTY_FIGURE_IMAGES)

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

function FigureBlock({ caption }: { caption: string }) {
  const figureImages = useContext(FigureImagesContext)
  const match = FIGURE_CAPTION_LINE.exec(caption.trim())
  const index = match ? Number(match[1]) : Number.NaN
  const figureSrc = Number.isFinite(index) ? figureImages[index] : undefined
  const safeSrc = typeof figureSrc === 'string' && figureSrc.trim().length > 0 ? figureSrc.trim() : null
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

const MARKDOWN_COMPONENTS: Components = {
  img({ src, alt, ...props }) {
    const safeSrc = typeof src === 'string' && src.trim() ? src.trim() : undefined
    if (!safeSrc) return null
    return <img {...props} src={safeSrc} alt={alt ?? ''} loading="lazy" decoding="async" />
  },
  blockquote({ children, node: _node, ...props }) {
    const caption = textFromMarkdownChildren(children).trim()
    if (FIGURE_CAPTION_LINE.test(caption)) {
      return <FigureBlock caption={caption} />
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
    const label = shortenLinkLabel(safe, textFromMarkdownChildren(children).trim() || safe)
    return (
      <a href={safe} target="_blank" rel="noopener noreferrer" {...props}>
        {label || safe}
      </a>
    )
  },
}

/**
 * Parsing the body is the expensive part of this subtree, so it is isolated
 * behind a memo boundary: only a new markdown string re-parses the article.
 */
const MarkdownArticle = memo(function MarkdownArticle({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={MARKDOWN_COMPONENTS}>
      {markdown}
    </ReactMarkdown>
  )
})

/** Render MarkItDown snapshot body as readable article text (not monospace pre). */
export const SignalBodyMarkdown = memo(
  forwardRef<HTMLElement, SignalBodyMarkdownProps>(function SignalBodyMarkdown(
    { markdown, className, figureByIndex },
    ref,
  ) {
    const renderedMarkdown = useMemo(
      () => sanitizeMarkdownUrlsInText(sanitizeSnapshotMarkdown(markdown)),
      [markdown],
    )

    return (
      <article ref={ref} className={className ?? 'evidence-markdown-article'}>
        <FigureImagesContext.Provider value={figureByIndex ?? EMPTY_FIGURE_IMAGES}>
          <MarkdownArticle markdown={renderedMarkdown} />
        </FigureImagesContext.Provider>
      </article>
    )
  }),
)
SignalBodyMarkdown.displayName = 'SignalBodyMarkdown'
