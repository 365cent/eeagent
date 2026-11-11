import type { PanoramaImportBatchOut } from '@/lib/api/types'

export type PanoramaImportStatus = PanoramaImportBatchOut['status']

export const PANORAMA_IMPORT_STATUS_LABEL: Record<PanoramaImportStatus, string> = {
  capturing: '采集中',
  structuring: '写入全景图',
  completed: '已完成',
  failed: '失败',
}

export const PANORAMA_IMPORT_STATUS_TAG: Record<
  PanoramaImportStatus,
  { color: 'processing' | 'success' | 'error' | 'default'; variant?: 'filled' | 'outlined' }
> = {
  capturing: { color: 'processing', variant: 'outlined' },
  structuring: { color: 'processing', variant: 'outlined' },
  completed: { color: 'default', variant: 'outlined' },
  failed: { color: 'error', variant: 'outlined' },
}

export function panoramaImportStatusIconClass(status: PanoramaImportStatus): string {
  if (status === 'failed') return 'is-failed'
  if (status === 'completed') return 'is-completed'
  return 'is-active'
}

export function panoramaImportAlertType(
  status: PanoramaImportStatus,
): 'error' | 'success' | 'info' {
  if (status === 'failed') return 'error'
  if (status === 'completed') return 'success'
  return 'info'
}

export function panoramaImportIsActive(status: PanoramaImportStatus): boolean {
  return status === 'capturing' || status === 'structuring'
}
