/**
 * MarkItDown and portal HTML (e.g. uml.org.cn sidebars) often emit GFM "tables"
 * that wrap the article in pipe-separated junk. remark-gfm then renders unusable
 * grids. Unwrap those blocks back to normal prose and normalize figure markers.
 */

export const FAILED_FIGURE_CAPTION_MARKERS = ['视觉模型未返回描述', '待视觉描述'] as const

export function isFailedFigureCaption(text: string): boolean {
  return FAILED_FIGURE_CAPTION_MARKERS.some((marker) => text.includes(marker))
}

const TABLE_LINE = /^\s*\|.+\|\s*$/

const FIGURE_LINK = /\[\s*图\s*(\d+)\s*[：:]\s*([^\]]+?)\s*\]\s*\([^)]+\)/g
const FIGURE_LINE = /(?:^|[\n])(\s*)(图\s*\d+\s*[：:][^\n|]+)/g
const FIGURE_INLINE = /(图\s*\d+\s*[：:]\s*（[^）|\n]+）)/g

function isTableLine(line: string): boolean {
  return TABLE_LINE.test(line)
}

function parseCells(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return []
  return trimmed
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim())
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function isMeaningfulCell(cell: string): boolean {
  const t = cell.trim()
  if (!t) return false
  if (t === '---' || /^-+$/.test(t)) return false
  if (/^:?-{3,}:?$/.test(t)) return false
  return true
}

function junkCellRatio(rows: string[][]): number {
  const flat = rows.flat()
  if (!flat.length) return 0
  const junk = flat.filter((cell) => !isMeaningfulCell(cell)).length
  return junk / flat.length
}

function isPortalSpamTable(rows: string[][]): boolean {
  if (rows.length === 0) return false
  const colCount = Math.max(...rows.map((row) => row.length))
  const ratio = junkCellRatio(rows)
  if (colCount >= 6 && ratio >= 0.25) return true
  if (colCount >= 4 && ratio >= 0.45) return true
  const flat = rows.flat()
  const hasLongProse = flat.some((cell) => cell.length >= 120)
  if (hasLongProse && colCount >= 4 && ratio >= 0.18) return true
  return false
}

function isDegenerateTable(rows: string[][]): boolean {
  if (rows.length === 0) return true
  const meaningfulPerRow = rows.map((row) => row.filter(isMeaningfulCell).length)
  if (meaningfulPerRow.every((n) => n === 0)) return true
  if (rows.length >= 2 && meaningfulPerRow.every((n) => n <= 1)) return true
  const colCount = Math.max(...rows.map((row) => row.length))
  if (colCount >= 2 && junkCellRatio(rows) >= 0.65) return true
  return false
}

function shouldUnwrapTable(rows: string[][]): boolean {
  if (rows.length === 0) return false
  if (isDegenerateTable(rows)) return true
  if (isPortalSpamTable(rows)) return true

  const colCount = Math.max(...rows.map((row) => row.length))
  const flat = rows.flat()
  if (flat.length === 0) return false
  const maxCellLen = Math.max(...flat.map((cell) => cell.length))
  const totalLen = flat.join('').length

  if (colCount === 1) {
    if (rows.length >= 3) return true
    if (maxCellLen >= 400) return true
  }
  if (rows.length === 1 && colCount === 1 && maxCellLen >= 200) return true
  if (rows.length <= 2 && colCount <= 2 && maxCellLen >= 2000) return true
  if (totalLen >= 4000 && colCount <= 2 && rows.length <= 3) return true
  if (rows.length === 1 && colCount >= 8) return true
  return false
}

function unwrapTableLines(lines: string[]): string {
  const parts: string[] = []
  for (const line of lines) {
    const cells = parseCells(line)
    if (isSeparatorRow(cells)) continue
    for (const cell of cells) {
      const t = cell.trim()
      if (!isMeaningfulCell(t)) continue
      parts.push(t)
    }
  }
  return parts.join('\n\n')
}

/** `学习助手](http://…)` → `[学习助手](http://…)` when MarkItDown drops `[`. */
function fixOrphanMarkdownLinkOpeners(text: string): string {
  return text.replace(/(^|[\s|>])([^\[\]|]{1,64})\]\((https?:\/\/[^)\s]+)\)/g, '$1[$2]($3)')
}

function fixBrokenBracketNesting(text: string): string {
  return text
    .replace(/\[\s*\[/g, '[')
    .replace(/\]\s*\]/g, ']')
    .replace(/\|\s*\[\s*$/gm, '')
}

/**
 * MarkItDown turns an image inside a link into a caption wrapped in link text,
 * which traps the blockquote in a table cell. Lift it out and drop the ad link.
 */
const LINKED_FIGURE_BLOCK =
  /(^|\n)[ \t]*\|?[ \t]*\[\s*\n+\s*>\s*(\u56fe\s*\d+\s*[\uff1a:]\s*[^\n]*)\n+\s*\]\([^)]*\)[ \t]*\|?/g

function normalizeLinkedFigureCaptions(text: string): string {
  return text.replace(
    LINKED_FIGURE_BLOCK,
    (_match, lead: string, caption: string) => lead + '\n\n> ' + caption.trim() + '\n\n',
  )
}

/** Ad-link wrappers around figure placeholders → GFM blockquote figures. */
function normalizeFigureBlockquotes(text: string): string {
  let out = text.replace(FIGURE_LINK, (_match, index: string, caption: string) => {
    return `\n\n> 图 ${index}：${String(caption).trim()}\n\n`
  })
  out = out.replace(FIGURE_LINE, (match, _indent: string, line: string) => {
    const trimmed = String(line).trim()
    if (trimmed.startsWith('>')) return match
    return `\n\n> ${trimmed}\n\n`
  })
  out = out.replace(FIGURE_INLINE, (_match, figure: string) => `\n\n> ${String(figure).trim()}\n\n`)
  return out
}

function isJunkPipeLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.includes('|')) return false
  const cells = parseCells(trimmed)
  if (!cells.length) return false
  if (isSeparatorRow(cells)) return false
  if (cells.length === 1 && /^[\s\-—]+$/.test(cells[0]!)) return true
  if (cells.every((cell) => cell === '---' || cell === '')) return true
  if (cells.every((cell) => !cell.trim() || cell === '---' || /^-+$/.test(cell))) return true
  return cells.length >= 2 && cells.every((cell) => /^-+$/.test(cell))
}

function stripOrphanSeparatorRows(lines: string[]): string[] {
  return lines.filter((line, index) => {
    const cells = parseCells(line)
    if (!isSeparatorRow(cells)) return true
    const prev = lines[index - 1]
    const next = lines[index + 1]
    const betweenTableRows =
      prev !== undefined && isTableLine(prev) && next !== undefined && isTableLine(next)
    return betweenTableRows
  })
}

function stripPipeNoiseLines(lines: string[]): string[] {
  return lines.filter((line) => {
    const trimmed = line.trim()
    if (/^\|+\s*$/.test(trimmed)) return false
    if (/^\|(?:\s*\|)+\s*$/.test(trimmed)) return false
    if (/^>\s*\|*\s*$/.test(trimmed)) return false
    return !isJunkPipeLine(line)
  })
}

function normalizeLoosePipeProse(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  if (/^\|+$/.test(trimmed)) return null
  if (/^>\s*\|+\s*$/.test(trimmed)) return null
  if (isTableLine(trimmed)) return line
  if (!trimmed.includes('|')) return line
  const softened = trimmed
    .replace(/\|\|+/g, ' · ')
    .replace(/\s+\|\s+/g, ' · ')
    .replace(/^\|+/g, '')
    .replace(/\|+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!softened || /^[·\-—\s]+$/.test(softened)) return null
  return softened
}

function stripInlinePipeNoise(text: string): string {
  return text
    .replace(/\|\s*---(?:\s+---)+\s*\|?/g, ' ')
    .replace(/(?:^|\n)\s*\|\s*(?:---\s*\|){2,}\s*(?:\n|$)/g, '\n')
}

function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

const SHORT_PORTAL_NAV_LINE =
  /^(求知|文章|文库|Lib|视频|iPerson|课程|认证|咨询|工具|讲座|会员|订阅|相关文章|相关文档|相关课程|最新文章|最新课程|成功案例|编辑推荐|最新活动计划)$/

function stripShortPortalNavLines(text: string): string {
  return text
    .split('\n')
    .filter((line) => !SHORT_PORTAL_NAV_LINE.test(line.trim()))
    .join('\n')
}

function sanitizeSnapshotMarkdownPass(markdown: string): string {
  const normalized = collapseBlankLines(
    stripInlinePipeNoise(
      normalizeFigureBlockquotes(fixBrokenBracketNesting(fixOrphanMarkdownLinkOpeners(markdown))),
    ),
  )
  let lines = stripOrphanSeparatorRows(stripPipeNoiseLines(normalized.split('\n')))
  const out: string[] = []
  let index = 0

  while (index < lines.length) {
    if (!isTableLine(lines[index]!)) {
      const line = lines[index]!
      if (line.trim().startsWith('> 图 ')) {
        out.push(line)
      } else if (/^\s*图\s*\d+\s*[：:]/.test(line.trim()) && !line.trim().startsWith('>')) {
        out.push(`> ${line.trim()}`)
      } else {
        const cleaned = normalizeLoosePipeProse(line)
        if (cleaned) out.push(cleaned)
      }
      index += 1
      continue
    }
    const blockStart = index
    while (index < lines.length && isTableLine(lines[index]!)) {
      index += 1
    }
    const blockLines = lines.slice(blockStart, index)
    const dataRows = blockLines
      .map(parseCells)
      .filter((cells) => cells.length > 0 && !isSeparatorRow(cells))
    if (shouldUnwrapTable(dataRows)) {
      const prose = unwrapTableLines(blockLines)
      if (prose) out.push(prose)
    } else {
      out.push(...blockLines)
    }
  }

  return stripShortPortalNavLines(collapseBlankLines(out.join('\n')))
}

/**
 * Split faux table blocks out of snapshot markdown while keeping real multi-column tables.
 */
export function sanitizeSnapshotMarkdown(markdown: string): string {
  if (!markdown.trim()) return markdown
  let current = normalizeLinkedFigureCaptions(markdown)
  for (let pass = 0; pass < 3; pass += 1) {
    const next = sanitizeSnapshotMarkdownPass(current)
    if (next === current) break
    current = next
  }
  return normalizeFigureBlockquotes(current)
}