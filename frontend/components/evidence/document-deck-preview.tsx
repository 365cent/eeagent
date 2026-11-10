'use client'

import { useEffect, useState } from 'react'
import { Spin, Typography } from 'antd'
import { documentDeckPreviewUrl } from '@/lib/api/client'
import { formatEeaApiError } from '@/lib/api/api-errors'
import { EeaApiError } from '@/lib/api/client'

const { Text } = Typography

type DocumentDeckPreviewProps = {
  documentId: string
}

export function DocumentDeckPreview({ documentId }: DocumentDeckPreviewProps) {
  const src = documentDeckPreviewUrl(documentId)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    setError(null)
    fetch(src, { method: 'GET', headers: { Accept: 'text/html' } })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((body) => {
            throw new EeaApiError(response.status, formatEeaApiError(response.status, body, src))
          })
        }
        if (!cancelled) setReady(true)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '无法加载幻灯片预览')
      })
    return () => {
      cancelled = true
    }
  }, [src])

  if (error) {
    return (
      <div className="document-deck-preview document-deck-preview--error">
        <Text type="danger">{error}</Text>
        <Text type="secondary">请确认后端可访问 reference deckpeek 且已安装 python-pptx。</Text>
      </div>
    )
  }

  return (
    <div className="document-deck-preview">
      {!ready ? (
        <div className="document-deck-preview-loading">
          <Spin description="生成幻灯片结构预览…" />
        </div>
      ) : null}
      <iframe
        title="PPTX 幻灯片预览"
        className="document-deck-preview-frame"
        sandbox="allow-same-origin allow-scripts"
        referrerPolicy="no-referrer"
        src={ready ? src : undefined}
      />
    </div>
  )
}
