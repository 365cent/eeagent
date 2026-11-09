import { signalArchiveUrl } from '@/lib/api/client'
import { fetchSignalFigures } from '@/lib/api/eea-api'

/** Match backend html_snapshot._MIN_FIGURE_BYTES */
const MIN_FIGURE_BYTES = 1500

const CHROME_SELECTORS = [
  "[class*='comment']",
  "[class*='Comment']",
  "[id*='comment']",
  "[class*='reply']",
  "[class*='Reply']",
  "[class*='operation']",
  "[class*='Operation']",
  "[class*='access-stat']",
  "[class*='AccessStat']",
]

const DATA_IMAGE = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i

function containerTextLen(el: Element): number {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim().length
}

/** Mirror backend _pick_body_container for figure order alignment. */
function pickBodyContainer(doc: Document): Element {
  const jsContent = doc.querySelector('#js_content')
  if (jsContent) return jsContent

  const frView = doc.querySelector('.fr-view')
  if (frView && containerTextLen(frView) >= 80) return frView

  const article = doc.querySelector('article')
  if (article) return article

  const main = doc.querySelector('main')
  if (main) {
    const inner = main.querySelector('.fr-view')
    if (inner && containerTextLen(inner) >= 80) return inner
    return main
  }

  return doc.body ?? doc.documentElement
}

function prunePortalChrome(container: Element): void {
  for (const selector of CHROME_SELECTORS) {
    container.querySelectorAll(selector).forEach((node) => node.remove())
  }
}

function decodedDataImageBytes(src: string): number | null {
  const match = DATA_IMAGE.exec(src.trim())
  if (!match) return null
  const b64 = match[2].replace(/\s/g, '')
  try {
    return atob(b64).length
  } catch {
    return null
  }
}

function isContentFigureSrc(src: string): boolean {
  if (!DATA_IMAGE.test(src.trim())) return false
  const size = decodedDataImageBytes(src)
  return size !== null && size >= MIN_FIGURE_BYTES
}

/** Indexed 1..N in the same order as backend _lift_content_images. */
export function extractFigureSrcByIndex(html: string): Record<number, string> {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const container = pickBodyContainer(doc)
  prunePortalChrome(container)

  const out: Record<number, string> = {}
  let index = 0
  container.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') ?? ''
    if (!isContentFigureSrc(src)) return
    index += 1
    out[index] = src.trim()
  })
  return out
}

export async function fetchSignalFigureByIndex(signalId: string): Promise<Record<number, string>> {
  try {
    const items = await fetchSignalFigures(signalId)
    const out: Record<number, string> = {}
    for (const item of items) out[item.index] = item.src
    if (Object.keys(out).length > 0) return out
  } catch {
    /* fall through to client-side archive parse */
  }
  return fetchArchiveFigureByIndex(signalId)
}

/** @deprecated Use fetchSignalFigureByIndex */
export const fetchArchiveFigureByIndex = fetchArchiveFigureByIndexFromHtml

async function fetchArchiveFigureByIndexFromHtml(signalId: string): Promise<Record<number, string>> {
  const response = await fetch(signalArchiveUrl(signalId), {
    headers: { Accept: 'text/html, */*' },
  })
  if (!response.ok) return {}
  const html = await response.text()
  return extractFigureSrcByIndex(html)
}

/** Blockquote body text when the snapshot uses `> 图 N：…` placeholders. */
export const FIGURE_CAPTION_LINE = /^图\s*(\d+)\s*[：:]\s*([\s\S]*)$/
