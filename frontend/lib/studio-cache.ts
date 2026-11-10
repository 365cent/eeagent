import type { StudioInfographicPayload, StudioMindmapPayload } from '@/lib/api/types'

const STORAGE_KEY = 'eea-studio-cache-v1'

export type StudioCacheEntry = {
  mindmap?: StudioMindmapPayload
  report?: string
  infographic?: StudioInfographicPayload
}

type Store = Record<string, StudioCacheEntry>

function readStore(): Store {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Store
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: Store) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // quota or private mode — in-memory state still works this session
  }
}

export function loadStudioCache(signalId: string): StudioCacheEntry {
  return readStore()[signalId] ?? {}
}

export function persistStudioCacheEntry(signalId: string, entry: StudioCacheEntry) {
  const store = readStore()
  store[signalId] = { ...store[signalId], ...entry }
  writeStore(store)
}

export function persistStudioKind<K extends keyof StudioCacheEntry>(
  signalId: string,
  kind: K,
  payload: StudioCacheEntry[K],
) {
  const store = readStore()
  const prev = store[signalId] ?? {}
  store[signalId] = { ...prev, [kind]: payload }
  writeStore(store)
}

export function clearStudioKind(signalId: string, kind: keyof StudioCacheEntry) {
  const store = readStore()
  const entry = { ...store[signalId] }
  delete entry[kind]
  if (Object.keys(entry).length === 0) {
    delete store[signalId]
  } else {
    store[signalId] = entry
  }
  writeStore(store)
}
