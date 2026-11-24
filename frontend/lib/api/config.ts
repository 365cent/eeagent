const DEFAULT_API_BASE = 'http://127.0.0.1:3000/api/v1'

const PRIVATE_LAN_HOST =
  /^(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/

/** Browser-facing EEA API root (includes `/api/v1`). */
export function getEeaApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EEA_API_BASE?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  if (typeof window !== 'undefined' && window.location.hostname) {
    const { hostname, origin } = window.location
    // Dev/LAN: call FastAPI directly so slow routes (tag-suggestions) do not trip Next.js rewrite proxy ECONNRESET.
    if (PRIVATE_LAN_HOST.test(hostname)) {
      return `http://${hostname}:8000/api/v1`
    }
    return `${origin}/api/v1`
  }
  return DEFAULT_API_BASE
}

/** Server-hosted Windows capture client build (newest zip in client/dist). */
export function getCaptureClientDownloadUrl(): string {
  return getEeaApiBase() + '/capture/client-download'
}
