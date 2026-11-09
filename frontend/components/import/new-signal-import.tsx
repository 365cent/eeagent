'use client'

import { useEffect, useRef, useState } from 'react'
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
  cancelCaptureJob,
  captureJobStageLabel,
  createCaptureJob,
  createSignal,
  getCaptureJob,
  inferChannelCode,
  pollCaptureJob,
  retryCaptureJob,
} from '@/lib/api/eea-api'
import { EeaApiError } from '@/lib/api/client'
import { sourceUrlFromSavedHtml } from '@/lib/ingest-source-url'
import { documentSummaryLine } from '@/lib/document-ingest'
import { DocumentIngestResult } from '@/components/import/document-ingest-result'
import type { CaptureJobOut, DocumentRawOut } from '@/lib/api/types'
import { eeaQueryKeys } from '@/hooks/use-eea-queries'
import {
  clearPendingCaptureJob,
  loadPendingCaptureJob,
  savePendingCaptureJob,
} from '@/lib/capture-job-session'

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
  const resumeAbort = useRef<AbortController | null>(null)
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadProcessing, setUploadProcessing] = useState(false)
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)
  const [jobStageLabel, setJobStageLabel] = useState<string | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [lastDocument, setLastDocument] = useState<DocumentRawOut | null>(null)
  const [lastDocumentName, setLastDocumentName] = useState<string | null>(null)
  const [jobError, setJobError] = useState<string | null>(null)

  const refreshSignals = () => {
    void queryClient.invalidateQueries({ queryKey: ['eea', 'signals'] })
    void queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
  }

  const clearUploadProgress = () => {
    setUploadProgress(null)
    setUploadProcessing(false)
    setUploadFileName(null)
    setJobStageLabel(null)
    setActiveJobId(null)
  }

  const onUploadProgress = (percent: number) => {
    setUploadProgress(percent)
    if (percent >= 100) {
      setUploadProcessing(true)
    }
  }

  const finishJobSuccess = (job: CaptureJobOut) => {
    const signal = job.result?.signal
    if (!signal?.id) {
      throw new Error('任务已完成但未返回信号')
    }
    clearPendingCaptureJob()
    clearUploadProgress()
    setJobError(null)
    if (job.result?.document) {
      setLastDocument(job.result.document)
      setLastDocumentName(job.result.document.filename ?? uploadFileName)
    }
    messageApi.success(
      job.result?.document
        ? `${uploadFileName ?? '文档'}：${documentSummaryLine(job.result.document)}`
        : `网页证据已入库：${signal.title}`,
    )
    refreshSignals()
    onNavigate(`singal/${signal.id}`)
  }

  const resumePendingJob = async (jobId: string, filename: string) => {
    setBusy(true)
    setUploadFileName(filename)
    setUploadProcessing(true)
    setUploadProgress(100)
    setActiveJobId(jobId)
    setJobError(null)
    resumeAbort.current?.abort()
    const controller = new AbortController()
    resumeAbort.current = controller
    try {
      const terminal = await pollCaptureJob(jobId, {
        signal: controller.signal,
        onUpdate: (job) => {
          setJobStageLabel(captureJobStageLabel(job.stage, job.status))
        },
      })
      if (terminal.status === 'succeeded') {
        finishJobSuccess(terminal)
      } else if (terminal.status === 'failed') {
        setJobError(terminal.error?.trim() || '采集任务失败')
        setActiveJobId(jobId)
      } else {
        clearPendingCaptureJob()
        clearUploadProgress()
      }
    } catch (err) {
      if (!(err instanceof EeaApiError && err.message === '轮询已中止')) {
        const detail = err instanceof EeaApiError ? err.message : String(err)
        setJobError(detail)
      }
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const pending = loadPendingCaptureJob()
    if (!pending || busy) return
    void resumePendingJob(pending.jobId, pending.filename)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resume once on mount
  }, [])

  useEffect(() => {
    return () => {
      resumeAbort.current?.abort()
    }
  }, [])

  const primaryActionLabel = (idle: string, busyIdle: string) => {
    if (!busy) return idle
    if (uploadProgress !== null) {
      if (uploadProcessing) return jobStageLabel ?? '服务端处理…'
      return `上传 ${uploadProgress}%`
    }
    return busyIdle
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
        signalUrl = `eea://document/${doc.id}`
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
      if (doc?.canonical_md_excerpt?.trim()) {
        bodyParts.push(doc.canonical_md_excerpt.trim())
      }
      if (doc) {
        bodyParts.push(`（关联文档 ${doc.id}${doc.filename ? ` · ${doc.filename}` : ''}）`)
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
        document_id: doc?.id,
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
    setJobError(null)
    setLastDocument(null)
    setLastDocumentName(null)
    const submissionId = crypto.randomUUID()
    resumeAbort.current?.abort()
    const controller = new AbortController()
    resumeAbort.current = controller
    try {
      const name = file.name.toLowerCase()
      let sourceUrl = url.trim()
      let fileBlob: Blob = file
      if (name.endsWith('.html') || name.endsWith('.htm')) {
        const html = await file.text()
        sourceUrl = sourceUrlFromSavedHtml(html) ?? sourceUrl
        if (!sourceUrl) {
          throw new Error('HTML 中找不到 http(s) 来源链接，请先粘贴 URL 或确保文件内含来源')
        }
        fileBlob = new Blob([html], { type: 'text/html; charset=utf-8' })
      }

      const accepted = await createCaptureJob(
        {
          file: fileBlob,
          filename: file.name,
          submissionId,
          url: sourceUrl || undefined,
          channelCode: sourceUrl ? inferChannelCode(sourceUrl) : undefined,
        },
        { onUploadProgress },
      )
      savePendingCaptureJob({
        jobId: accepted.id,
        submissionId,
        filename: file.name,
        startedAt: new Date().toISOString(),
      })
      setActiveJobId(accepted.id)
      setUploadProcessing(true)
      const terminal = await pollCaptureJob(accepted.id, {
        signal: controller.signal,
        onUpdate: (job) => {
          setJobStageLabel(captureJobStageLabel(job.stage, job.status))
        },
      })
      if (terminal.status === 'succeeded') {
        finishJobSuccess(terminal)
      } else if (terminal.status === 'failed') {
        setJobError(terminal.error?.trim() || '采集任务失败')
      } else {
        clearPendingCaptureJob()
        messageApi.info('采集任务已取消')
      }
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      setJobError(detail)
      messageApi.error(`${file.name}: ${detail}`)
    } finally {
      setBusy(false)
      if (!loadPendingCaptureJob()) {
        clearUploadProgress()
      }
    }
    return false
  }

  const onRetryJob = async () => {
    if (!activeJobId) return
    setBusy(true)
    setJobError(null)
    try {
      await retryCaptureJob(activeJobId)
      setUploadProcessing(true)
      const terminal = await pollCaptureJob(activeJobId, {
        onUpdate: (job) => {
          setJobStageLabel(captureJobStageLabel(job.stage, job.status))
        },
      })
      if (terminal.status === 'succeeded') {
        finishJobSuccess(terminal)
      } else {
        setJobError(terminal.error?.trim() || '采集任务失败')
      }
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      setJobError(detail)
      messageApi.error(detail)
    } finally {
      setBusy(false)
    }
  }

  const onCancelJob = async () => {
    if (!activeJobId) return
    try {
      const job = await getCaptureJob(activeJobId)
      if (job.status === 'queued') {
        await cancelCaptureJob(activeJobId)
      }
    } catch {
      /* best effort */
    }
    clearPendingCaptureJob()
    resumeAbort.current?.abort()
    clearUploadProgress()
    setJobError(null)
    setBusy(false)
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
                ? `${jobStageLabel ?? '服务端处理'} ${uploadFileName}…`
                : `正在上传 ${uploadFileName}（${uploadProgress}%）`
              : '拖入 PDF / Word / PPT / Markdown / 图片 / HTML'}
          </p>
          <Text type="secondary" className="import-dragger-hint">
            文件走可恢复采集任务；刷新页面可继续查看进度。网页在线抓取请用 EEA Capture。
          </Text>
        </Upload.Dragger>
      </div>
      {jobError ? (
        <Alert
          type="error"
          showIcon
          title="采集任务失败"
          description={jobError}
          action={
            <Space>
              {activeJobId ? (
                <Button size="small" onClick={() => void onRetryJob()}>
                  重试
                </Button>
              ) : null}
              <Button size="small" onClick={() => void onCancelJob()}>
                清除
              </Button>
            </Space>
          }
          style={{ marginBottom: 12 }}
        />
      ) : null}
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
                ? jobStageLabel ?? '处理中…'
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
            PDF、Word、PPT、Markdown 或图片 → 可恢复采集任务 → MarkItDown 与图块描述
          </Text>
        </div>
      </div>
      <div className="timeline-item">
        <ClockCircleOutlined />
        <div>
          <Text strong>网页 / HTML</Text>
          <Text type="secondary">拖入 html 或通过采集任务入库；粘贴链接与正文可手动保存</Text>
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
