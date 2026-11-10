'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Space, Typography } from 'antd'
import { documentPreviewPdfUrl } from '@/lib/api/client'
import { DocumentPdfViewerSkeleton } from '@/components/evidence/document-pdf-viewer-skeleton'

const { Text } = Typography

type DocumentPdfViewerProps = {
  documentId: string
  filename?: string | null
}

const PDF_LOAD_FALLBACK_MS = 2500

export function DocumentPdfViewer({ documentId, filename }: DocumentPdfViewerProps) {
  const fileUrl = useMemo(() => documentPreviewPdfUrl(documentId), [documentId])
  const [frameReady, setFrameReady] = useState(false)
  const [frameError, setFrameError] = useState<string | null>(null)

  useEffect(() => {
    setFrameReady(false)
    setFrameError(null)
    let cancelled = false
    const fallback = window.setTimeout(() => {
      if (!cancelled) setFrameReady(true)
    }, PDF_LOAD_FALLBACK_MS)
    fetch(fileUrl, { method: 'HEAD', credentials: 'same-origin' })
      .then((response) => {
        if (cancelled) return
        if (!response.ok) {
          setFrameError(`PDF 预览不可用（HTTP ${response.status}）`)
        }
      })
      .catch(() => {
        if (!cancelled) setFrameError('无法连接预览服务')
      })
    return () => {
      cancelled = true
      window.clearTimeout(fallback)
    }
  }, [fileUrl])

  return (
    <div className="document-pdf-viewer">
      <Space className="document-pdf-viewer-toolbar" wrap align="center">
        {filename ? (
          <Text type="secondary" ellipsis style={{ maxWidth: 360 }}>
            {filename}
          </Text>
        ) : null}
        <Button type="link" size="small" href={fileUrl} target="_blank" rel="noopener noreferrer">
          新窗口打开
        </Button>
      </Space>
      {frameError ? (
        <Text type="danger">{frameError}</Text>
      ) : null}
      <div className="document-pdf-viewer-frame-wrap">
        {!frameReady ? (
          <div className="document-pdf-viewer-frame-loading" aria-hidden>
            <DocumentPdfViewerSkeleton label="加载 PDF 预览" />
          </div>
        ) : null}
        <iframe
          title={filename ? `PDF 预览：${filename}` : 'PDF 预览'}
          className="document-pdf-viewer-frame"
          src={fileUrl}
          referrerPolicy="no-referrer"
          onLoad={() => setFrameReady(true)}
        />
      </div>
    </div>
  )
}
