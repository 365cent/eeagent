import type { DocumentChunkOut } from '@/lib/api/types'

export type DocumentResearchFocus = {
  chunkId?: number
  figureIndex?: number
}

export type DocumentSectionNode = {
  key: string
  title: string
  path: string[]
  chunkIds: number[]
  figureIndices: number[]
  children: DocumentSectionNode[]
}

export type DocumentSectionTree = {
  roots: DocumentSectionNode[]
  byKey: Map<string, DocumentSectionNode>
  chunkToSection: Map<number, string>
  figureToSection: Map<number, string>
}

export type DocumentCitationRef =
  | { kind: 'chunk'; documentId: string; chunkId: number }
  | { kind: 'figure'; documentId: string; figureIndex: number }

export function sectionKey(path: string[]): string {
  return 'sec:' + path.map((part) => encodeURIComponent(part)).join('/')
}

export function formatSectionPath(path: string[] | null | undefined): string {
  return path && path.length ? path.join(' / ') : '正文'
}

function positiveInt(value: string | null | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function firstLine(text: string): string {
  const index = text.indexOf('\n')
  return (index === -1 ? text : text.slice(0, index)).trim()
}

function lastLine(text: string): string {
  const index = text.lastIndexOf('\n')
  return (index === -1 ? text : text.slice(index + 1)).trim()
}

/**
 * Join section chunks back into one markdown document.
 *
 * Ingest splits long GFM tables across chunks; a blank line between those
 * chunks would end the table, so consecutive table rows stay on adjacent lines.
 */
export function joinChunkMarkdown(chunkTexts: string[]): string {
  const parts = chunkTexts.map((text) => text.trim()).filter(Boolean)
  let joined = ''
  for (const part of parts) {
    if (!joined) {
      joined = part
      continue
    }
    const continuesTable = lastLine(joined).startsWith('|') && firstLine(part).startsWith('|')
    joined += (continuesTable ? '\n' : '\n\n') + part
  }
  return joined
}

export function buildDocumentSectionTree(chunks: DocumentChunkOut[]): DocumentSectionTree {
  const byKey = new Map<string, DocumentSectionNode>()
  const order = new Map<string, number>()
  const chunkToSection = new Map<number, string>()
  const figureToSection = new Map<number, string>()

  const ensureNode = (path: string[]): DocumentSectionNode => {
    const key = sectionKey(path)
    const existing = byKey.get(key)
    if (existing) return existing
    const node: DocumentSectionNode = {
      key,
      title: path.length ? path[path.length - 1] : '正文',
      path,
      chunkIds: [],
      figureIndices: [],
      children: [],
    }
    order.set(key, order.size)
    byKey.set(key, node)
    return node
  }

  for (const chunk of chunks) {
    const path = chunk.section_path ?? []
    for (let depth = 1; depth <= path.length; depth += 1) {
      ensureNode(path.slice(0, depth))
    }
    const node = ensureNode(path)
    node.chunkIds.push(chunk.chunk_id)
    for (const figureIndex of chunk.figure_indices ?? []) {
      if (!node.figureIndices.includes(figureIndex)) node.figureIndices.push(figureIndex)
      if (!figureToSection.has(figureIndex)) figureToSection.set(figureIndex, node.key)
    }
    chunkToSection.set(chunk.chunk_id, node.key)
  }

  for (const node of byKey.values()) {
    node.chunkIds.sort((a, b) => a - b)
    node.figureIndices.sort((a, b) => a - b)
    if (node.path.length > 1) {
      const parent = byKey.get(sectionKey(node.path.slice(0, -1)))
      if (parent) parent.children.push(node)
    }
  }

  const sortNodes = (nodes: DocumentSectionNode[]) =>
    nodes.sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0))
  const roots = [...byKey.values()].filter(
    (node) => node.path.length <= 1 || !byKey.has(sectionKey(node.path.slice(0, -1))),
  )
  for (const node of byKey.values()) sortNodes(node.children)
  sortNodes(roots)

  return { roots, byKey, chunkToSection, figureToSection }
}

export function parseDocumentCitationRef(refId: string): DocumentCitationRef | null {
  const match = /^(doc|fig):([0-9a-fA-F-]{36}):(\d+)$/.exec(refId.trim())
  if (!match) return null
  const index = Number.parseInt(match[3], 10)
  if (!Number.isFinite(index) || index < 1) return null
  if (match[1] === 'doc') {
    return { kind: 'chunk', documentId: match[2], chunkId: index }
  }
  return { kind: 'figure', documentId: match[2], figureIndex: index }
}

export function parseDocumentResearchFocus(search: string): DocumentResearchFocus {
  const params = new URLSearchParams(search)
  const chunkId = positiveInt(params.get('doc_chunk'))
  const figureIndex = positiveInt(params.get('doc_figure'))
  return {
    ...(chunkId ? { chunkId } : {}),
    ...(figureIndex ? { figureIndex } : {}),
  }
}

export function buildDocumentResearchSearch(
  search: string,
  focus: DocumentResearchFocus,
): string {
  const params = new URLSearchParams(search)
  params.delete('doc_chunk')
  params.delete('doc_figure')
  if (focus.chunkId) params.set('doc_chunk', String(focus.chunkId))
  if (focus.figureIndex) params.set('doc_figure', String(focus.figureIndex))
  return params.toString()
}

export function citationLabel(refId: string): string {
  const parsed = parseDocumentCitationRef(refId)
  if (!parsed) return '引用'
  return parsed.kind === 'chunk' ? '章节 ' + parsed.chunkId : '图块 ' + parsed.figureIndex
}
