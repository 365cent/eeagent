'use client'

import { useState } from 'react'
import {
  App as AntApp,
  Alert,
  Button,
  Descriptions,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  documentSummaryLine,
  formatDocumentSize,
  ingestStatusMeta,
} from '@/lib/document-ingest'
import { StatusTag } from '@/features/shared/status-tag'
import {
  fetchDocument,
  fetchDocumentCanonicalMd,
  reingestDocument,
  createSignal,
} from '@/lib/api/eea-api'
import type { DocumentDetail, DocumentRawOut } from '@/lib/api/types'
import { EeaApiError } from '@/lib/api/client'
import { documentCanonicalUrl } from '@/lib/api/client'
import { useQueryClient } from '@tanstack/react-query'
import { eeaQueryKeys } from '@/hooks/use-eea-queries'

const { Text, Paragraph } = Typography

type DocumentIngestResultProps = {
  doc: DocumentRawOut | DocumentDetail
  filename?: string
  onUpdated?: (doc: DocumentDetail) => void
  onNavigate?: (key: string) => void
}

export function DocumentIngestResult({ doc, filename, onUpdated, onNavigate }: DocumentIngestResultProps) {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const [current, setCurrent] = useState(doc)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMd, setPreviewMd] = useState<string | null>(null)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [retryBusy, setRetryBusy] = useState(false)
  const [saveSignalBusy, setSaveSignalBusy] = useState(false)

  const status = ingestStatusMeta(current.ingest_status)
  const displayName = filename ?? current.filename ?? current.id
  const ingestError = 'ingest_error' in current ? current.ingest_error : null
  const hasCanonical =
    ('has_canonical' in current && current.has_canonical) ||
    (current.ingest_status === 'parsed' && Boolean(current.canonical_md_excerpt))

  const openPreview = async () => {
    setPreviewOpen(true)
    setPreviewBusy(true)
    setPreviewMd(null)
    try {
      const md = await fetchDocumentCanonicalMd(current.id)
      setPreviewMd(md)
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '无法加载 canonical Markdown')
      setPreviewOpen(false)
    } finally {
      setPreviewBusy(false)
    }
  }

  const retryIngest = async () => {
    setRetryBusy(true)
    try {
      const detail = await reingestDocument(current.id)
      setCurrent(detail)
      onUpdated?.(detail)
      messageApi.success(documentSummaryLine(detail))
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '重新解析失败')
    } finally {
      setRetryBusy(false)
    }
  }

  const refreshMeta = async () => {
    try {
      const detail = await fetchDocument(current.id)
      setCurrent(detail)
      onUpdated?.(detail)
    } catch {
      /* ignore */
    }
  }

  const saveAsSignal = async () => {
    if (current.ingest_status !== 'parsed' && current.ingest_status !== 'stored') {
      messageApi.warning('请先完成文档解析再保存为信号')
      return
    }
    setSaveSignalBusy(true)
    try {
      const sig = await createSignal({ document_id: current.id, channel_code: 'web' })
      await queryClient.invalidateQueries({ queryKey: ['eea', 'signals'] })
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
      messageApi.success('已保存为信号（默认无主题，请在证据详情指定主题）')
      onNavigate?.(`singal/${sig.id}`)
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '保存为信号失败')
    } finally {
      setSaveSignalBusy(false)
    }
  }

  return (
    <>
      <Alert
        type={
          current.ingest_status === 'parsed'
            ? 'success'
            : current.ingest_status === 'failed'
              ? 'error'
              : current.ingest_status === 'skipped'
                ? 'warning'
                : 'info'
        }
        showIcon
        title={
          <Space wrap>
            <span>文档已入库：{displayName}</span>
            <StatusTag meta={status} />
          </Space>
        }
        description={
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="大小">{formatDocumentSize(current.size)}</Descriptions.Item>
              <Descriptions.Item label="MIME">{current.mime}</Descriptions.Item>
              {current.markitdown_version ? (
                <Descriptions.Item label="MarkItDown">{current.markitdown_version}</Descriptions.Item>
              ) : null}
              {current.vision_model ? (
                <Descriptions.Item label="视觉模型">{current.vision_model}</Descriptions.Item>
              ) : null}
              {current.ingest_status === 'parsed' ? (
                <Descriptions.Item label="图块语义">{current.figure_count} 张</Descriptions.Item>
              ) : null}
              <Descriptions.Item label="文档 ID">
                <Text copyable={{ text: current.id }}>{current.id}</Text>
              </Descriptions.Item>
            </Descriptions>
            {ingestError ? (
              <Text type="danger">{ingestError}</Text>
            ) : null}
            {current.canonical_md_excerpt ? (
              <>
                <Text type="secondary">canonical Markdown 摘录</Text>
                <pre className="document-canonical-excerpt">{current.canonical_md_excerpt}</pre>
              </>
            ) : current.ingest_status === 'skipped' ? (
              <Text type="secondary">
                文件超过服务端 MarkItDown 解析上限（默认 120 MiB，见 backend
                `DOC_INGEST_MAX_BYTES`）时仅保留原始 blob，不生成 canonical Markdown。
              </Text>
            ) : null}
            <Space wrap>
              {hasCanonical ? (
                <Button size="small" onClick={() => void openPreview()}>
                  查看完整 Markdown
                </Button>
              ) : null}
              {hasCanonical ? (
                <Button
                  size="small"
                  href={documentCanonicalUrl(current.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  新标签打开
                </Button>
              ) : null}
              {current.ingest_status !== 'parsed' ? (
                <Button size="small" loading={retryBusy} onClick={() => void retryIngest()}>
                  重新解析
                </Button>
              ) : null}
              <Button size="small" type="link" onClick={() => void refreshMeta()}>
                刷新状态
              </Button>
              {(current.ingest_status === 'parsed' || current.ingest_status === 'stored') && onNavigate ? (
                <Button size="small" type="primary" loading={saveSignalBusy} onClick={() => void saveAsSignal()}>
                  保存为信号
                </Button>
              ) : null}
            </Space>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              服务端使用 MarkItDown 生成 canonical Markdown，并对嵌入图片做视觉描述（扫描版 PDF
              为页级描述，不做 OCR 全文）。后续 Agent 可直接读取{' '}
              <Text code>GET /documents/&#123;id&#125;/canonical.md</Text>。
            </Paragraph>
          </Space>
        }
      />
      <Modal
        title="canonical Markdown"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewOpen(false)}>
            关闭
          </Button>,
        ]}
        width={720}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        {previewBusy ? (
          <Text type="secondary">加载中…</Text>
        ) : (
          <pre className="document-canonical-full">{previewMd ?? ''}</pre>
        )}
      </Modal>
    </>
  )
}
