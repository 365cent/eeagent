export const DUPLICATE_URL_SUFFIX_RE = / \(重复采集 #\d+\)$/

export function duplicateUrlCaptureMessage(title: string): string {
  return `该链接与已有证据同源，已允许入库并自动改名：${title}`
}
