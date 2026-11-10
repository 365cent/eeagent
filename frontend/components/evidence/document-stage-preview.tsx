'use client'

import dynamic from 'next/dynamic'
import { Spin } from 'antd'

function PreviewLoading() {
  return (
    <div className="document-stage-preview-loading">
      <Spin description="加载文档预览…" />
    </div>
  )
}

export const DocumentDeckPreviewLazy = dynamic(
  () => import('@/components/evidence/document-deck-preview').then((m) => m.DocumentDeckPreview),
  { ssr: false, loading: PreviewLoading },
)

export const DocumentPdfViewerLazy = dynamic(
  () => import('@/components/evidence/document-pdf-viewer').then((m) => m.DocumentPdfViewer),
  { ssr: false, loading: PreviewLoading },
)
