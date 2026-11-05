'use client'

import { useState } from 'react'
import {
  BulbOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FileAddOutlined,
  LinkOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { App as AntApp, Alert, Button, Card, Col, Input, Progress, Row, Space, Typography, Upload } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import {
  captureSignal,
  createSignal,
  documentEvidenceUrl,
  fetchDocumentCanonicalMd,
  inferChannelCode,
  uploadRawDocument,
} from '@/lib/api/eea-api'
import { EeaApiError } from '@/lib/api/client'
import { sourceUrlFromSavedHtml } from '@/lib/ingest-source-url'
import { documentSummaryLine } from '@/lib/document-ingest'
import { DocumentIngestResult } from '@/components/import/document-ingest-result'
import type { DocumentRawOut } from '@/lib/api/types'
import { eeaQueryKeys } from '@/hooks/use-eea-queries'

const { Text } = Typography

type NewSignalImportProps = {
  onNavigate: (key: string) => void
}

export function SignalImportCaptureNotice() {
  return (
    <Alert
      type="info"
      showIcon
      title="网站抓取请使用 EEA Capture"
      description="浏览器内无法直接打开外网页面。需要抓取在线网页时，请使用 EEA Capture 客户端。也可在上方粘贴链接与正文，或拖入文件完成入库。"
      style={{ marginTop: 0 }}
    />
  )
}

export function NewSignalImport({ onNavigate }: NewSignalImportProps) {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadProcessing, setUploadProcessing] = useState(false)
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)
  const [lastDocument, setLastDocument] = useState<DocumentRawOut | null>(null)
  const [lastDocumentName, setLastDocumentName] = useState<string | null>(null)

  const refreshSignals = () => {
    void queryClient.invalidateQueries({ queryKey: ['eea', 'signals'] })
    void queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
  }

  const clearUploadProgress = () => {
    setUploadProgress(null)
    setUploadProcessing(false)
    setUploadFileName(null)
  }

  const onUploadProgress = (percent: number) => {
    setUploadProgress(percent)
    if (percent >= 100) {
      setUploadProcessing(true)
    }
  }

  const primaryActionLabel = (idle: string, busyIdle: string) => {
    if (!busy) return idle
    if (uploadProgress !== null) {
      if (uploadProcessing) return '解析中…'
      return `上传 ${uploadProgress}%`
    }
    return busyIdle
  }

  const buildDocumentBody = async (doc: DocumentRawOut): Promise<string | undefined> => {
    const parts: string[] = []
    if (doc.canonical_md_excerpt?.trim()) {
      parts.push(doc.canonical_md_excerpt.trim())
    } else if (doc.ingest_status === 'parsed') {
      try {
        const md = await fetchDocumentCanonicalMd(doc.id)
        if (md.trim()) {
          parts.push(md.trim())
        }
      } catch {
        /* excerpt optional */
      }
    }
    parts.push(`（关联文档 ${doc.id}${doc.filename ? ` · ${doc.filename}` : ''}）`)
    return parts.join('\n\n') || undefined
  }

  const submitSignal = async (options: { requireUrl: boolean }) => {
    const trimmedUrl = url.trim()
    const trimmedNotes = notes.trim()
    const doc = lastDocument

    if (options.requireUrl && !trimmedUrl) {
      messageApi.warning('请先粘贴来源 URL')
      return
    }
    if (!options.requireUrl && !trimmedUrl && !trimmedNotes && !doc) {
      messageApi.warning('请粘贴 URL、填写正文，或先上传文档')
      return
    }

    setBusy(true)
    clearUploadProgress()
    try {
      let signalUrl = trimmedUrl
      if (!signalUrl && doc) {
        signalUrl = documentEvidenceUrl(doc.id)
      }
      if (!signalUrl) {
        signalUrl = 'eea://paste/local'
      }

      const titleFromDoc =
        (lastDocumentName ?? doc?.filename)?.replace(/\.[^.]+$/, '') ||
        lastDocumentName ||
        doc?.filename
      const title = trimmedUrl || titleFromDoc || trimmedNotes.slice(0, 120) || '未命名信号'

      const bodyParts: string[] = []
      if (trimmedNotes) {
        bodyParts.push(trimmedNotes)
      }
      if (doc) {
        const docBody = await buildDocumentBody(doc)
        if (docBody) {
          bodyParts.push(docBody)
        }
      }
      const body_text = bodyParts.length ? bodyParts.join('\n\n') : undefined
      const excerpt = trimmedNotes || doc?.canonical_md_excerpt?.trim() || undefined

      const sig = await createSignal({
        title,
        url: signalUrl,
        channel_code: inferChannelCode(signalUrl),
        body_text,
        excerpt,
        evidence_status_code: body_text ? 'retained' : undefined,
      })
      messageApi.success(`已创建信号 ${sig.title}`)
      refreshSignals()
      onNavigate(`singal/${sig.id}`)
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '创建失败')
    } finally {
      setBusy(false)
    }
  }

  const pasteFallback = () => submitSignal({ requireUrl: true })
  const saveSignal = () => submitSignal({ requireUrl: false })

  const handleBeforeUpload = async (file: File) => {
    setBusy(true)
    setUploadFileName(file.name)
    setUploadProgress(0)
    setUploadProcessing(false)
    try {
      const name = file.name.toLowerCase()
      if (name.endsWith('.html') || name.endsWith('.htm')) {
        const html = await file.text()
        const source = sourceUrlFromSavedHtml(html) ?? url.trim()
        if (!source) {
          throw new Error('HTML 中找不到 http(s) 来源链接')
        }
        const sig = await captureSignal(
          {
            url: source,
            archiveHtml: new Blob([html], { type: 'text/html; charset=utf-8' }),
            filename: file.name,
            channelCode: inferChannelCode(source),
          },
          { onUploadProgress },
        )
        messageApi.success(`网页证据已入库：${sig.title}`)
        refreshSignals()
        onNavigate(`singal/${sig.id}`)
      } else {
        const doc = await uploadRawDocument(file, { onUploadProgress })
        setLastDocument(doc)
        setLastDocumentName(file.name)
        messageApi.success(`${file.name}：${documentSummaryLine(doc)}`)
      }
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(`${file.name}: ${detail}`)
    } finally {
      setBusy(false)
      clearUploadProgress()
    }
    return false
  }

  return (
    <div className="new-signal-import-form">
      <Space.Compact block>
        <Input
          prefix={<LinkOutlined />}
          placeholder="粘贴文章或网页 URL（配合下方正文为粘贴入库）"
          size="large"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button type="primary" size="large" loading={busy} onClick={() => void pasteFallback()}>
          {primaryActionLabel('粘贴入库', '入库中…')}
        </Button>
      </Space.Compact>
      <div className="import-dragger-wrap">
        <Upload.Dragger
          multiple
          accept=".html,.htm,.pdf,.doc,.docx,.ppt,.pptx,.md,.txt,.png,.jpg,.jpeg"
          showUploadList={false}
          beforeUpload={(file) => {
            void handleBeforeUpload(file)
            return false
          }}
          disabled={busy}
          className="import-dragger-fill"
        >
          <p>
            <UploadOutlined />
          </p>
          <p className="import-dragger-title">
            {uploadProgress !== null && uploadFileName
              ? uploadProcessing
                ? `正在解析 ${uploadFileName}…`
                : `正在上传 ${uploadFileName}（${uploadProgress}%）`
              : '拖入 PDF / Word / PPT / Markdown / 图片'}
          </p>
          <Text type="secondary" className="import-dragger-hint">
            网页请用 EEA Capture 或上传单个 html；Office / PDF / 图片由服务端 MarkItDown 解析并生成图块语义
          </Text>
        </Upload.Dragger>
      </div>
      <Input.TextArea
        rows={4}
        placeholder="粘贴正文（可选，与上方链接一起保存为信号）"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {lastDocument ? (
        <DocumentIngestResult
          doc={lastDocument}
          filename={lastDocumentName ?? undefined}
          onUpdated={(detail) => setLastDocument(detail)}
          onNavigate={onNavigate}
        />
      ) : null}
      <div className="import-form-actions">
        {uploadProgress !== null ? (
          <Progress
            className="import-upload-progress"
            percent={uploadProcessing ? 100 : uploadProgress}
            status={uploadProcessing ? 'active' : 'normal'}
            format={() =>
              uploadProcessing
                ? '解析中…'
                : `${uploadProgress ?? 0}%`
            }
          />
        ) : null}
        <Space wrap>
          <Button
            type="primary"
            icon={<FileAddOutlined />}
            loading={busy}
            onClick={() => void saveSignal()}
          >
            {primaryActionLabel('保存信号', '保存中…')}
          </Button>
          <Button onClick={() => onNavigate('signals')}>查看证据库</Button>
        </Space>
      </div>
    </div>
  )
}

function SignalImportFlowPanel() {
  return (
    <div className="signal-import-flow">
      <div className="timeline-item">
        <CheckCircleFilled />
        <div>
          <Text strong>原始文档</Text>
          <Text type="secondary">
            PDF、Word、PPT、Markdown 或图片 → MarkItDown + 图块视觉描述，生成 canonical Markdown
          </Text>
        </div>
      </div>
      <div className="timeline-item">
        <ClockCircleOutlined />
        <div>
          <Text strong>网页 / HTML</Text>
          <Text type="secondary">上传单个 html，或粘贴链接与正文，系统解析并留存证据</Text>
        </div>
      </div>
      <div className="timeline-item">
        <BulbOutlined />
        <div>
          <Text strong>公网在线页面</Text>
          <Text type="secondary">在 EEA Capture 客户端提交 URL，自动抓取并留存网页</Text>
        </div>
      </div>
      <div className="signal-import-notice">
        <SignalImportCaptureNotice />
      </div>
    </div>
  )
}

export function NewSignalImportPage({ onNavigate }: NewSignalImportProps) {
  return (
    <Row gutter={[18, 18]} className="new-signal-import-row">
      <Col xs={24} lg={16} className="new-signal-import-col new-signal-import-stack">
        <Card className="panel-card new-signal-import-card" title="导入证据">
          <NewSignalImport onNavigate={onNavigate} />
        </Card>
        <Card
          className="panel-card new-signal-import-card new-signal-import-side new-signal-import-flow-card"
          title="解析流程"
        >
          <SignalImportFlowPanel />
        </Card>
      </Col>
    </Row>
  )
}
