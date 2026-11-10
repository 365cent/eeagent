/** Build spoken segments from snapshot markdown (no backend). */
export type AudioOverviewSegment = { text: string; quote: string }

const MAX_SEGMENTS = 8
const MIN_LEN = 12

function stripMarkdownInline(value: string): string {
  return value
    .replace(/^#+\s*/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\\_/g, '_')
    .trim()
}

/** Legacy DB excerpts that are really site chrome / nav rails. */
export function excerptLooksLikeChrome(text: string): boolean {
  const t = text.replace(/\s+/g, ' ')
  if (/https?:\/\//.test(t)) return true
  if (t.includes('全部标签') && t.includes('+')) return true
  if ((t.match(/\+/g)?.length ?? 0) >= 4 && t.length < 500) return true
  return false
}

/** Plain-text preview for sidebars (no raw `**` or headings). */
export function plainMarkdownSnippet(markdown: string, maxLen = 280): string {
  const collapsed = collapseMarkdownBlocks(markdown)
  if (!collapsed) return ''
  if (collapsed.length <= maxLen) return collapsed
  return `${collapsed.slice(0, maxLen - 1)}…`
}

/** Sidebar excerpt: skip title echo, figure quotes, and OA author lines. */
export function sourceExcerptSnippet(markdown: string, title: string | undefined, maxLen = 220): string {
  const titlePlain = title ? stripMarkdownInline(title.replace(/^(新闻详情|文章详情|详情页?)[\-–—]\s*/, '')) : ''
  const blocks = markdown
    .split(/\n{2,}/)
    .map((block) => stripMarkdownInline(block.replace(/\s+/g, ' ')))
    .filter((block) => block.length > 0 && !/^>\s/.test(block))
    .filter((block) => {
      if (
        titlePlain &&
        block.startsWith(titlePlain.slice(0, Math.min(20, titlePlain.length))) &&
        block.length <= titlePlain.length + 12
      ) {
        return false
      }
      if (/^[\s\S]{0,80}[\(（][^)）]{2,80}[\)）]\d{4}-\d{2}-\d{2}/.test(block)) return false
      if (/(?:[\w\u4e00-\u9fff/.-]{2,24}\s*\+\s*){3,}/.test(block)) return false
      if ((block.includes('全部标签') || block.includes('首页')) && block.includes('+')) return false
      return true
    })
  const collapsed = blocks.join(' ').replace(/\s+/g, ' ').trim()
  if (!collapsed) return plainMarkdownSnippet(markdown, maxLen)
  if (collapsed.length <= maxLen) return collapsed
  return `${collapsed.slice(0, maxLen - 1)}…`
}

function collapseMarkdownBlocks(markdown: string): string {
  return markdown
    .split(/\n{2,}/)
    .map((block) => stripMarkdownInline(block.replace(/\s+/g, ' ')))
    .filter((block) => block.length > 0 && !/^>\s/.test(block))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstSpeakableSentence(block: string): string {
  const plain = stripMarkdownInline(block.replace(/\s+/g, ' '))
  if (!plain) return ''
  const match = plain.match(/^[^。！？.!?]+[。！？.!?]?/)
  const sentence = (match ? match[0] : plain.slice(0, 160)).trim()
  return sentence.length > 220 ? `${sentence.slice(0, 217)}…` : sentence
}

export function buildAudioOverviewSegments(markdown: string): AudioOverviewSegment[] {
  const blocks = markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const segments: AudioOverviewSegment[] = []
  for (const block of blocks) {
    if (segments.length >= MAX_SEGMENTS) break
    if (/^#+\s/.test(block)) continue
    if (/^>\s/.test(block)) continue
    if (/^!\[/.test(block)) continue
    if (/^EEAFIG\d/i.test(block)) continue

    const sentence = firstSpeakableSentence(block)
    if (sentence.length < MIN_LEN) continue
    const quote = stripMarkdownInline(block.split('\n')[0] ?? block).slice(0, 120)
    const quoteForMatch = quote.length >= MIN_LEN ? quote : sentence
    segments.push({ text: sentence, quote: quoteForMatch })
  }

  if (segments.length === 0 && markdown.trim()) {
    const fallback = firstSpeakableSentence(markdown.slice(0, 400))
    if (fallback) segments.push({ text: fallback, quote: fallback.slice(0, 80) })
  }

  return segments
}
