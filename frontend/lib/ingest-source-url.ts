/** Read http(s) source URL from saved page HTML (canonical → og:url → twitter:url). */
export function sourceUrlFromSavedHtml(html: string): string | null {
  const trimmed = html.replace(/^\uFEFF/, '')
  const patterns = [
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
    /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i,
    /<meta[^>]+name=["']twitter:url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:url["']/i,
  ]
  for (const re of patterns) {
    const match = trimmed.match(re)
    if (!match?.[1]) continue
    try {
      const url = new URL(match[1].trim())
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.href
      }
    } catch {
      /* ignore invalid URL */
    }
  }
  return null
}
