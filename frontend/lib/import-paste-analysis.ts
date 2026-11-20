export const URL_IN_TEXT = /https?:\/\/[^\s<>'"]+/gi

export type PasteAnalysis = {
  urls: string[]
  body: string
  mode: 'empty' | 'batch-capture' | 'paste-signal'
}

export function analyzeImportPaste(text: string): PasteAnalysis {
  const trimmed = text.trim()
  if (!trimmed) {
    return { urls: [], body: '', mode: 'empty' }
  }
  const seen = new Set<string>()
  const urls: string[] = []
  const prose: string[] = []
  for (const line of trimmed.replace(/\r\n/g, '\n').split('\n')) {
    const row = line.trim()
    if (!row) continue
    const matches = [...row.matchAll(URL_IN_TEXT)]
    if (matches.length) {
      for (const match of matches) {
        const candidate = match[0].replace(/[.,;)'"\]]+$/, '')
        const key = candidate.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        urls.push(candidate)
      }
      const withoutUrls = row.replace(URL_IN_TEXT, ' ').replace(/\s+/g, ' ').trim()
      if (withoutUrls) {
        prose.push(withoutUrls)
      }
      continue
    }
    prose.push(row)
  }
  const body = prose.join('\n\n').trim()
  if (urls.length >= 2) {
    return { urls, body, mode: 'batch-capture' }
  }
  return { urls, body, mode: 'paste-signal' }
}

export function importModeHint(analysis: PasteAnalysis): string {
  if (analysis.mode === 'empty') {
    return '粘贴链接或正文；多行 URL 将批量采集。'
  }
  if (analysis.mode === 'batch-capture') {
    return `已识别 ${analysis.urls.length} 条链接 → 复制到 EEA Capture 客户端采集。`
  }
  if (analysis.urls.length === 1 && analysis.body) {
    return '已识别 1 条链接与正文 → 保存为信号。'
  }
  if (analysis.urls.length === 1) {
    return '已识别 1 条链接。'
  }
  return '将按正文入库。'
}

export function primarySubmitLabel(analysis: PasteAnalysis, busy: boolean): string {
  if (!busy) {
    if (analysis.mode === 'batch-capture') return '排队等待客户端采集'
    if (analysis.mode === 'paste-signal' && (analysis.urls.length || analysis.body)) return '保存信号'
    return '智能导入'
  }
  return analysis.mode === 'batch-capture' ? '排队中…' : '保存中…'
}