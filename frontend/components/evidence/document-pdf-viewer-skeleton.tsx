'use client'

/** In-pane placeholder while the preview stream or iframe loads. */
export function DocumentPdfViewerSkeleton({ label = '准备 PDF 预览' }: { label?: string }) {
  return (
    <div
      className="document-pdf-viewer document-pdf-viewer--skeleton"
      aria-busy="true"
      aria-label={label}
    >
      <div className="document-pdf-viewer-skeleton-toolbar" role="presentation">
        <div className="skeleton-block skeleton-pdf-chip" />
        <div className="skeleton-block skeleton-pdf-chip skeleton-pdf-chip--link" />
      </div>
      <div className="document-pdf-viewer-canvas document-pdf-viewer-canvas--skeleton">
        <div className="skeleton-block skeleton-pdf-page" />
      </div>
    </div>
  )
}
