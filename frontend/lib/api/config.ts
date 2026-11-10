const DEFAULT_API_BASE = 'http://127.0.0.1:3000/api/v1'

/** Browser-facing EEA API root (includes `/api/v1`). Always same-origin; Next proxies to FastAPI. */
export function getEeaApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EEA_API_BASE?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `${window.location.origin}/api/v1`
  }
  return DEFAULT_API_BASE
}
