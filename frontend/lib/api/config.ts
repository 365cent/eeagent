const DEFAULT_API_BASE = 'http://127.0.0.1:8000/api/v1'

/** Browser-facing EEA API root (includes `/api/v1`). */
export function getEeaApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EEA_API_BASE?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  // Follow the address the user actually opened the platform on: when the
  // browser hits http://10.215.8.74:3000, the API is http://10.215.8.74:8000.
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:8000/api/v1`
  }
  return DEFAULT_API_BASE
}
