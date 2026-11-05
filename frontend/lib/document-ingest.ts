import type { DocumentRawOut } from '@/lib/api/types'

export type IngestStatus = DocumentRawOut['ingest_status']

export function ingestStatusMeta(status: string): {
  label: string
  color: 'success' | 'processing' | 'error' | 'warning' | 'default'
} {
  switch (status) {
    case 'parsed':
      return { label: '已解析', color: 'success' }
    case 'failed':
      return { label: '解析失败', color: 'error' }
    case 'skipped':
      return { label: '跳过解析', color: 'warning' }
    case 'stored':
      return { label: '已存储', color: 'default' }
    default:
      return { label: status, color: 'default' }
  }
}

export function formatDocumentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}

export function documentSummaryLine(doc: Pick<DocumentRawOut, 'ingest_status' | 'figure_count' | 'vision_model'>): string {
  const { label } = ingestStatusMeta(doc.ingest_status)
  const parts = [label]
  if (doc.ingest_status === 'parsed') {
    parts.push(`${doc.figure_count ?? 0} 张图块语义`)
    if (doc.vision_model) parts.push(doc.vision_model)
  }
  return parts.join(' · ')
}
