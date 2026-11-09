const DEFAULT_API_BASE = 'http://127.0.0.1:8000/api/v1'

/** Browser-facing EEA API root (includes `/api/v1`). */
export function getEeaApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EEA_API_BASE?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location.hostname) {
    if (process.env.NODE_ENV === 'development') {
      // The local Next dev server and API run on separate ports.
      return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
    }
    // Production routes the API through the same TLS origin as the web app.
    return `${window.location.origin}/api/v1`
  }
  return DEFAULT_API_BASE
}
