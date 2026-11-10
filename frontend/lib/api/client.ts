import { getEeaApiBase } from '@/lib/api/config'
import { formatEeaApiError } from '@/lib/api/api-errors'

export class EeaApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'EeaApiError'
  }
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
    throw new EeaApiError(response.status, formatEeaApiError(response.status, body, path))
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
    throw new EeaApiError(response.status, formatEeaApiError(response.status, body, path))
  }
  return response.text()
}

export function signalArchiveUrl(signalId: string): string {
  return `${getEeaApiBase()}/signals/${encodeURIComponent(signalId)}/archive`
}

export function documentCanonicalUrl(documentId: string): string {
  return `${getEeaApiBase()}/documents/${encodeURIComponent(documentId)}/canonical.md`
}

export function documentPreviewPdfUrl(documentId: string): string {
  return `${getEeaApiBase()}/documents/${encodeURIComponent(documentId)}/preview.pdf`
}

export function documentDeckPreviewUrl(documentId: string): string {
  return `${getEeaApiBase()}/documents/${encodeURIComponent(documentId)}/deck-preview`
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
