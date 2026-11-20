/**
 * MarkItDown and WeChat HTML often emit a single-column GFM "table" that wraps
 * the whole article (one cell with thousands of characters). remark-gfm then
 * renders one giant <td>. Unwrap those blocks back to normal prose.
 */

const TABLE_LINE = /^\s*\|.+\|\s*$/

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

function shouldUnwrapTable(rows: string[][]): boolean {
  if (rows.length === 0) return false
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
  return false
}

function unwrapTableLines(lines: string[]): string {
  const parts: string[] = []
  for (const line of lines) {
    const cells = parseCells(line)
    if (isSeparatorRow(cells)) continue
    for (const cell of cells) {
      if (cell) parts.push(cell)
    }
  }
  return parts.join('\n\n')
}

/**
 * Split faux table blocks out of snapshot markdown while keeping real multi-column tables.
 */
export function sanitizeSnapshotMarkdown(markdown: string): string {
  if (!markdown.trim()) return markdown
  const lines = markdown.split('\n')
  const out: string[] = []
  let index = 0

  while (index < lines.length) {
    if (!isTableLine(lines[index]!)) {
      out.push(lines[index]!)
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

  return out.join('\n')
}