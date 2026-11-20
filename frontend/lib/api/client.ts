import { getEeaApiBase } from '@/lib/api/config'
import { formatEeaApiError } from '@/lib/api/api-errors'

export class EeaApiError extends Error {
  readonly code?: string
  readonly demandIds: string[]

  constructor(
    readonly status: number,
    message: string,
    extra?: { code?: string; demandIds?: string[] },
  ) {
    super(message)
    this.name = 'EeaApiError'
    this.code = extra?.code
    this.demandIds = extra?.demandIds ?? []
  }
}

export function eeaErrorMessage(err: unknown, fallback = '操作失败'): string {
  if (err instanceof EeaApiError) return err.message
  if (err instanceof Error && err.message.trim()) {
    const raw = err.message.trim()
    if (/^failed to fetch$/i.test(raw) || /^networkerror/i.test(raw) || /^load failed$/i.test(raw)) {
      const base = getEeaApiBase()
      return (
        `无法连接 API（${raw}）。请确认 backend 已启动且数据库已迁移（backend 目录执行 uv run alembic upgrade head）。` +
        `当前请求地址：${base}`
      )
    }
    return raw
  }
  const text = String(err).trim()
  return text || fallback
}

function readEeaErrorExtra(body: string): { code?: string; demandIds?: string[] } {
  if (!body.trim().startsWith('{')) return {}
  try {
    const parsed = JSON.parse(body) as { detail?: unknown }
    const detail = parsed.detail
    if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return {}
    const record = detail as { code?: unknown; demand_ids?: unknown }
    const demandIds = Array.isArray(record.demand_ids)
      ? record.demand_ids.filter((item): item is string => typeof item === 'string' && item.length > 0)
      : []
    return {
      code: typeof record.code === 'string' ? record.code : undefined,
      demandIds,
    }
  } catch {
    return {}
  }
}

function throwEeaApiError(response: Response, body: string, path: string): never {
  throw new EeaApiError(response.status, formatEeaApiError(response.status, body, path), readEeaErrorExtra(body))
}

export async function eeaFetchWithMeta<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; headers: Headers }> {
  const url = `${getEeaApiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throwEeaApiError(response, body, path)
  }
  if (response.status === 204) {
    return { data: undefined as T, headers: response.headers }
  }
  const data = (await response.json()) as T
  return { data, headers: response.headers }
}

export async function eeaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getEeaApiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throwEeaApiError(response, body, path)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

/** Plain-text GET (signal body, etc.). */
export async function eeaFetchText(path: string, init?: RequestInit): Promise<string> {
  const url = `${getEeaApiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'text/plain, text/html, */*',
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throwEeaApiError(response, body, path)
  }
  return response.text()
}

export function signalArchiveUrl(signalId: string): string {
  const base = `${getEeaApiBase()}/signals/${encodeURIComponent(signalId)}/archive`
  // The replay answers from the API origin while the workspace runs on another
  // one, so the archive names this page's origin for CSP frame-ancestors; the
  // backend honours it only when it matches its CORS allow-list.
  const embedOrigin = typeof window === 'undefined' ? null : window.location.origin
  return embedOrigin ? `${base}?embed_origin=${encodeURIComponent(embedOrigin)}` : base
}

export function documentCanonicalUrl(documentId: string): string {
  return `${getEeaApiBase()}/documents/${encodeURIComponent(documentId)}/canonical.md`
}

export function documentPreviewPdfUrl(documentId: string): string {
  return `${getEeaApiBase()}/documents/${encodeURIComponent(documentId)}/preview.pdf`
}

export function documentDeckPreviewUrl(documentId: string): string {
  const base = `${getEeaApiBase()}/documents/${encodeURIComponent(documentId)}/deck-preview`
  return `${base}?eea_embed=5`
}

export async function eeaFetchBlob(path: string, init?: RequestInit): Promise<Blob> {
  const url = `${getEeaApiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/pdf,application/octet-stream,*/*',
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new EeaApiError(response.status, formatEeaApiError(response.status, body, path))
  }
  return response.blob()
}

export function toQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export type UploadProgressHandler = (percent: number) => void

/** Multipart POST with upload progress (fetch cannot report FormData upload bytes). */
export function eeaPostFormData<T>(
  path: string,
  form: FormData,
  options?: { onUploadProgress?: UploadProgressHandler },
): Promise<T> {
  const url = `${getEeaApiBase()}${path.startsWith('/') ? path : `/${path}`}`
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.upload.onprogress = (event) => {
      if (!options?.onUploadProgress || !event.lengthComputable || event.total <= 0) return
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
      options.onUploadProgress(percent)
    }
    xhr.onload = () => {
      const body = xhr.responseText ?? ''
      if (xhr.status >= 200 && xhr.status < 300) {
        if (xhr.status === 204) {
          resolve(undefined as T)
          return
        }
        try {
          resolve(JSON.parse(body) as T)
        } catch {
          reject(new EeaApiError(xhr.status, `invalid JSON: ${body.slice(0, 200)}`))
        }
        return
      }
      reject(new EeaApiError(xhr.status, formatEeaApiError(xhr.status, body, path)))
    }
    xhr.onerror = () => reject(new EeaApiError(0, '网络错误：上传失败'))
    xhr.onabort = () => reject(new EeaApiError(0, '上传已取消'))
    xhr.send(form)
  })
}
