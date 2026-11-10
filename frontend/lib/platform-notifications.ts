import type { PanoramaImportBatchOut } from '@/lib/api/types'

const ACK_KEY = 'eea-notifications-acked-batch-ids'

export type PlatformNotificationItem = {
  id: string
  kind: 'panorama_import'
  batch: PanoramaImportBatchOut
}

function readAckedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(ACK_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

function writeAckedIds(ids: Set<string>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACK_KEY, JSON.stringify([...ids]))
}

const listeners = new Set<() => void>()

export function subscribeNotificationReadState(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emitNotificationReadState() {
  listeners.forEach((listener) => listener())
}

export function markPanoramaBatchRead(batchId: string) {
  const next = readAckedIds()
  next.add(batchId)
  writeAckedIds(next)
  emitNotificationReadState()
}

export function markAllPanoramaBatchesRead(batchIds: string[]) {
  const next = readAckedIds()
  batchIds.forEach((id) => next.add(id))
  writeAckedIds(next)
  emitNotificationReadState()
}

export function isPanoramaBatchUnread(batch: PanoramaImportBatchOut): boolean {
  if (batch.status !== 'completed' && batch.status !== 'failed') return false
  return !readAckedIds().has(batch.id)
}

export function panoramaImportIsActive(batch: PanoramaImportBatchOut): boolean {
  return batch.status === 'capturing' || batch.status === 'structuring'
}
