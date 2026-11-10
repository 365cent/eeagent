const OFFICE_SUFFIXES = new Set(['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.xlsm'])

const MIME_SUFFIX: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.ms-powerpoint': '.ppt',
}

function suffixFromFilename(filename: string | null | undefined, mime: string | null | undefined): string {
  if (filename) {
    const dot = filename.lastIndexOf('.')
    if (dot >= 0) return filename.slice(dot).toLowerCase()
  }
  return MIME_SUFFIX[(mime ?? '').toLowerCase()] ?? '.bin'
}

/** Whether GET /documents/{id}/preview.pdf is expected to work for this upload. */
export function documentPdfPreviewSupported(filename: string | null | undefined, mime: string | null | undefined): boolean {
  const suffix = suffixFromFilename(filename, mime)
  return suffix === '.pdf' || OFFICE_SUFFIXES.has(suffix)
}

/** Whether GET /documents/{id}/deck-preview (deckpeek structure viewer) applies. */
export function documentPptxDeckPreviewSupported(
  filename: string | null | undefined,
  mime: string | null | undefined,
): boolean {
  const suffix = suffixFromFilename(filename, mime)
  return suffix === '.ppt' || suffix === '.pptx'
}

/** Evidence studio「预览」: PPTX → deckpeek; PDF/Word/other office → preview.pdf. */
export function documentStagePreviewMode(
  filename: string | null | undefined,
  mime: string | null | undefined,
): 'deck' | 'pdf' | null {
  if (documentPptxDeckPreviewSupported(filename, mime)) return 'deck'
  if (documentPdfPreviewSupported(filename, mime)) return 'pdf'
  return null
}
