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

export function DocumentPdfViewer({ documentId, filename }: DocumentPdfViewerProps) {
  const fileUrl = useMemo(() => documentPreviewPdfUrl(documentId), [documentId])
  const [frameReady, setFrameReady] = useState(false)

  useEffect(() => {
    setFrameReady(false)
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
          sandbox="allow-same-origin allow-scripts"
          referrerPolicy="no-referrer"
          onLoad={() => setFrameReady(true)}
        />
      </div>
    </div>
  )
}
