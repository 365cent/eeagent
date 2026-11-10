'use client'

import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const chatMarkdownComponents: Components = {
  a({ href, children, ...props }) {
    const safe =
      typeof href === 'string' && (href.startsWith('https://') || href.startsWith('http://')) ? href : undefined
    if (!safe) {
      return <span>{children}</span>
    }
    return (
      <a href={safe} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    )
  },
  pre({ children }) {
    return <pre className="chat-markdown-pre">{children}</pre>
  },
  code({ className, children, ...props }) {
    const inline = !className
    if (inline) {
      return (
        <code className="chat-markdown-code-inline" {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  },
}

type ChatMarkdownProps = {
  content: string
}

/** Assistant reply body: GFM markdown inside chat bubbles (lists, links, emphasis). */
export function ChatMarkdown({ content }: ChatMarkdownProps) {
  if (!content.trim()) return null
  return (
    <div className="chat-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={chatMarkdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
