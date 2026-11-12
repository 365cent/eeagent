import type { DocumentRawOut } from '@/lib/api/types'

export type IngestStatus = DocumentRawOut['ingest_status']

import { ingestStatusMeta } from '@/lib/status-registry'

export { ingestStatusMeta }

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
