/**
 * Read the http(s) source URL from a saved page.
 *
 * Order: SingleFile provenance comment → canonical → og:url → twitter:url.
 * SingleFile rewrites tags with unquoted attributes
 * (`<link rel=canonical href=https://…>`), so the attribute reader accepts
 * double-quoted, single-quoted and unquoted values.
 */

const LINK_TAG = /<link\b[^>]*>/gi
const META_TAG = /<meta\b[^>]*>/gi
const ATTR = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

// SingleFile prepends its provenance comment before the saved content:
//   <!--
//    Page saved with SingleFile
//    url: https://example.com/page
//    saved date: Thu Nov 19 2026 16:55:30 GMT+0800
//   -->
const SINGLEFILE_HEADER = /<!--[\s\S]{0,2000}?saved with single[\s-]?file\b[\s\S]{0,2000}?\burl:[ \t]*(https?:\/\/[^\s"'<>]+)/i
// Legacy archives: MSIE "Save as" and old Safari exports.
const SAVED_FROM_HEADER = /<!--[\s\S]{0,200}?saved from url=\(\d+\)[ \t]*(https?:\/\/[^\s"'<>]+)/i
const HEADER_SCAN_LIMIT = 64 * 1024

function attributesOf(tag: string): Map<string, string> {
  const attrs = new Map<string, string>()
  for (const match of tag.matchAll(ATTR)) {
    const key = match[1].toLowerCase()
    const value = match[2] ?? match[3] ?? match[4]
    if (value === undefined || attrs.has(key)) continue
    attrs.set(key, value)
  }
  return attrs
}

function hasToken(list: string | undefined, want: string): boolean {
  if (!list) return false
  return list.toLowerCase().split(/\s+/).includes(want)
}

function usableUrl(raw: string | undefined): string | null {
  const trimmed = (raw ?? '').trim().replace(/&amp;/gi, '&')
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href
    }
  } catch {
    /* ignore invalid URL */
  }
  return null
}

/** Read http(s) source URL from saved page HTML (SingleFile header → canonical → og:url → twitter:url). */
export function sourceUrlFromSavedHtml(html: string): string | null {
  const text = html.replace(/^\uFEFF/, '')

  const head = text.slice(0, HEADER_SCAN_LIMIT)
  const header = head.match(SINGLEFILE_HEADER) ?? head.match(SAVED_FROM_HEADER)
  const headerUrl = usableUrl(header?.[1])
  if (headerUrl) return headerUrl

  for (const tag of text.matchAll(LINK_TAG)) {
    const attrs = attributesOf(tag[0])
    if (!hasToken(attrs.get('rel'), 'canonical')) continue
    const url = usableUrl(attrs.get('href'))
    if (url) return url
  }

  for (const tag of text.matchAll(META_TAG)) {
    const attrs = attributesOf(tag[0])
    const key = (attrs.get('property') ?? attrs.get('name') ?? '').trim().toLowerCase()
    if (key !== 'og:url' && key !== 'twitter:url') continue
    const url = usableUrl(attrs.get('content'))
    if (url) return url
  }

  return null
}
