import { isValidElement, type ReactNode } from 'react'

/** Flatten ReactMarkdown-rendered nodes into plain text for caption matching. */
export function textFromMarkdownChildren(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textFromMarkdownChildren).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textFromMarkdownChildren(node.props.children)
  return ''
}
