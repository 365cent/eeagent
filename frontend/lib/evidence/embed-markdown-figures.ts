import { FIGURE_CAPTION_LINE } from '@/lib/evidence/archive-figures'

export function isFigureCaptionAlt(alt: string | undefined): boolean {
  if (!alt) return false
  return FIGURE_CAPTION_LINE.test(alt.trim())
}
