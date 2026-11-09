const HIGHLIGHT_CLASS = 'evidence-tts-highlight'

function clearHighlights(root: HTMLElement) {
  root.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`).forEach((mark) => {
    const parent = mark.parentNode
    if (!parent) return
    parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark)
    parent.normalize()
  })
}

/** Highlight the first occurrence of `quote` inside `root`; returns cleanup. */
export function highlightQuoteInArticle(root: HTMLElement, quote: string, allowShort = true): () => void {
  clearHighlights(root)
  const needle = quote.trim()
  if (!needle) return () => clearHighlights(root)

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node: Text | null = walker.nextNode() as Text | null
  while (node) {
    const text = node.textContent ?? ''
    const index = text.indexOf(needle)
    if (index !== -1) {
      const before = text.slice(0, index)
      const after = text.slice(index + needle.length)
      const mark = document.createElement('mark')
      mark.className = HIGHLIGHT_CLASS
      mark.textContent = needle
      const parent = node.parentNode
      if (!parent) break
      if (before) parent.insertBefore(document.createTextNode(before), node)
      parent.insertBefore(mark, node)
      if (after) parent.insertBefore(document.createTextNode(after), node)
      parent.removeChild(node)
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return () => clearHighlights(root)
    }
    node = walker.nextNode() as Text | null
  }

  if (allowShort && needle.length > 8) {
    const short = needle.slice(0, Math.min(24, needle.length))
    if (short !== needle) {
      return highlightQuoteInArticle(root, short, false)
    }
  }

  return () => clearHighlights(root)
}

export function clearArticleHighlights(root: HTMLElement | null) {
  if (root) clearHighlights(root)
}
