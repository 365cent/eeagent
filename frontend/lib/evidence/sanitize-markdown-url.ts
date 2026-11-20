/** Junk copied from table cells after Feishu / WeChat URLs (fullwidth or ASCII punctuation). */
const URL_JUNK_MARKERS = ['；', ';', '，', ',', '。', '）', ')', '】', ']', '、'] as const

function tryDecodeUri(raw: string): string {
  try {
    return decodeURI(raw)
  } catch {
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
}

/**
 * Trim autolink targets that include trailing Chinese prose after the real URL.
 */
export function sanitizeMarkdownUrl(raw: string): string | undefined {
  const candidate = raw.trim()
  if (!/^https?:\/\//i.test(candidate)) return undefined

  let decoded = tryDecodeUri(candidate)
  const encodedSemi = candidate.toLowerCase().indexOf('%ef%bc%9b')
  if (encodedSemi > 0) {
    decoded = tryDecodeUri(candidate.slice(0, encodedSemi))
  }

  const protocolEnd = decoded.indexOf('://') + 3
  let cutAt = decoded.length
  for (const marker of URL_JUNK_MARKERS) {
    const idx = decoded.indexOf(marker, protocolEnd)
    if (idx >= 0) cutAt = Math.min(cutAt, idx)
  }
  const spaceIdx = decoded.indexOf(' ', protocolEnd)
  if (spaceIdx >= 0) cutAt = Math.min(cutAt, spaceIdx)

  const href = decoded
    .slice(0, cutAt)
    .trim()
    .replace(/[，,。.；;]+$/u, '')

  try {
    const url = new URL(href)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return url.href
  } catch {
    return undefined
  }
}

/** Fix inline / table URLs in snapshot markdown before GFM autolink parsing. */
export function sanitizeMarkdownUrlsInText(markdown: string): string {
  if (!markdown.includes('http')) return markdown
  return markdown.replace(/https?:\/\/[^\s|<>")\]]+/gi, (match) => sanitizeMarkdownUrl(match) ?? match)
}

export function shortenLinkLabel(href: string, label: string): string {
  const trimmed = label.trim()
  if (!trimmed.startsWith('http')) return label
  const safe = sanitizeMarkdownUrl(trimmed)
  if (!safe) return label
  if (trimmed.length <= 72) return safe
  try {
    const url = new URL(safe)
    const path = url.pathname.length > 40 ? `${url.pathname.slice(0, 39)}…` : url.pathname
    return `${url.hostname}${path}`
  } catch {
    return safe
  }
}