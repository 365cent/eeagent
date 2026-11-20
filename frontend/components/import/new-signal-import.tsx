'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { App as AntApp, Card, Col, Row } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import {
  cancelCaptureJob,
  captureJobStageLabel,
  createCaptureJob,
  createSignal,
  fetchLatestPanoramaImport,
  fetchSignal,
  fetchPanoramaImportBatch,
  getCaptureJob,
  importCaptureUrlList,
  inferChannelCode,
  pollCaptureJob,
  retryCaptureJob,
} from '@/lib/api/eea-api'
import { EeaApiError, eeaErrorMessage } from '@/lib/api/client'
import { sourceUrlFromSavedHtml } from '@/lib/ingest-source-url'
import { duplicateUrlCaptureMessage } from '@/lib/signal-duplicate-notice'
import { documentSummaryLine } from '@/lib/document-ingest'
import { DocumentIngestResult } from '@/components/import/document-ingest-result'
import type { CaptureJobOut, DocumentRawOut, PanoramaImportBatchOut } from '@/lib/api/types'
import { eeaQueryKeys } from '@/hooks/use-eea-queries'
import {
  clearPendingCaptureJob,
  loadPendingCaptureJob,
  savePendingCaptureJob,
} from '@/lib/capture-job-session'
import { analyzeImportPaste, type PasteAnalysis } from '@/lib/import-paste-analysis'
import { ImportUnifiedSurface } from '@/components/import/import-unified-surface'
import { ImportProgressSide } from '@/components/import/import-progress-side'

type NewSignalImportProps = {
  onNavigate: (key: string) => void
}

function useNewSignalImport(onNavigate: (key: string) => void) {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const resumeAbort = useRef<AbortController | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadProcessing, setUploadProcessing] = useState(false)
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)
  const [jobStageLabel, setJobStageLabel] = useState<string | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [lastDocument, setLastDocument] = useState<DocumentRawOut | null>(null)
  const [lastDocumentName, setLastDocumentName] = useState<string | null>(null)
  const [jobError, setJobError] = useState<string | null>(null)
  const [panoramaBatch, setPanoramaBatch] = useState<PanoramaImportBatchOut | null>(null)

  const analysis = useMemo(() => analyzeImportPaste(pasteText), [pasteText])
  const pasteHintId = 'eea-import-paste-hint'
  const uploadInFlight = uploadProgress !== null

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

  const finishJobSuccess = async (job: CaptureJobOut) => {
    const signal =
      job.result?.signal ??
      (job.signal_id ? await fetchSignal(job.signal_id).catch(() => null) : null)
    if (!signal?.id) {
      throw new Error(
        job.error?.trim() || '任务已完成但未返回信号详情；可在信号列表中查找或重试采集。',
      )
    }
    clearPendingCaptureJob()
    clearUploadProgress()
    setJobError(null)
    if (job.result?.document) {
      setLastDocument(job.result.document)
      setLastDocumentName(job.result.document.filename ?? uploadFileName)
    }
    if (job.result?.document) {
      messageApi.success(`${uploadFileName ?? '文档'}：${documentSummaryLine(job.result.document)}`)
    } else if (signal.url_duplicate_renamed) {
      messageApi.warning(duplicateUrlCaptureMessage(signal.title))
    } else {
      messageApi.success(`网页证据已入库：${signal.title}`)
    }
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
        await finishJobSuccess(terminal)
      } else if (terminal.status === 'failed') {
        setJobError(terminal.error?.trim() || '采集任务失败')
        setActiveJobId(jobId)
      } else {
        clearPendingCaptureJob()
        clearUploadProgress()
      }
    } catch (err) {
      if (!(err instanceof EeaApiError && err.message === '轮询已中止')) {
        setJobError(eeaErrorMessage(err))
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
    void fetchLatestPanoramaImport()
      .then((batch) => {
        if (!batch) return
        if (batch.status === 'capturing' || batch.status === 'structuring') {
          setPanoramaBatch(batch)
        }
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    return () => {
      resumeAbort.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!panoramaBatch?.id || panoramaBatch.status === 'completed' || panoramaBatch.status === 'failed') {
      return
    }
    let cancelled = false
    const tick = async () => {
      try {
        const next = await fetchPanoramaImportBatch(panoramaBatch.id)
        if (!cancelled) {
          setPanoramaBatch(next)
          if (next.status === 'completed') {
            refreshSignals()
            messageApi.success(
              `批量采集完成：已留存 ${next.signals_retained} 条信号。若链接与既有证据同源，将自动加「重复采集」后缀并保留两条记录。`,
              8,
            )
          }
        }
      } catch {
        /* polling best effort */
      }
    }
    const timer = setInterval(() => void tick(), 4000)
    void tick()
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [panoramaBatch?.id, panoramaBatch?.status, messageApi])

  const savePasteSignal = async (parsed: PasteAnalysis) => {
    const trimmedUrl = parsed.urls[0]?.trim() ?? ''
    const trimmedNotes = parsed.body.trim()
    const doc = lastDocument

    if (!trimmedUrl && !trimmedNotes && !doc) {
      messageApi.warning('请粘贴内容或先上传文档')
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
      setPasteText('')
      refreshSignals()
      onNavigate(`singal/${sig.id}`)
    } catch (err) {
      messageApi.error(eeaErrorMessage(err) || '创建失败')
    } finally {
      setBusy(false)
    }
  }

  const submitBatchCapture = async (text: string) => {
    setBusy(true)
    try {
      const batch = await importCaptureUrlList(text)
      setPanoramaBatch(batch)
      setPasteText('')
      messageApi.success(
        `已排队 ${batch.capture_jobs_total || '若干'} 条采集任务；请保持 EEA Capture 客户端运行。与既有证据同源的链接仍会采集，标题将自动加后缀区分。`,
        8,
      )
      refreshSignals()
    } catch (err) {
      messageApi.error(eeaErrorMessage(err) || '批量排队失败')
    } finally {
      setBusy(false)
    }
  }

  const submitPastebin = async () => {
    if (analysis.mode === 'empty' && !lastDocument) {
      messageApi.warning('请粘贴链接、正文，或拖入文件')
      return
    }
    if (analysis.mode === 'batch-capture') {
      await submitBatchCapture(pasteText.trim())
      return
    }
    await savePasteSignal(analysis)
  }

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
      if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) {
        messageApi.info(
          '请在工作簿「数据来源」中复制链接列，粘贴到文本框（每行一条），系统将自动识别并批量采集。',
          10,
        )
        setBusy(false)
        clearUploadProgress()
        return
      }
      let sourceUrl = analysis.urls[0]?.trim() ?? ''
      let fileBlob: Blob = file
      if (name.endsWith('.html') || name.endsWith('.htm')) {
        const html = await file.text()
        sourceUrl = sourceUrlFromSavedHtml(html) ?? sourceUrl
        if (!sourceUrl) {
          throw new Error(
            'HTML 中找不到来源链接（已查 SingleFile 文件头、canonical、og:url）；请在文本框粘贴该页 URL 后重试',
          )
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
        await finishJobSuccess(terminal)
      } else if (terminal.status === 'failed') {
        setJobError(terminal.error?.trim() || '采集任务失败')
      } else {
        clearPendingCaptureJob()
        messageApi.info('采集任务已取消')
      }
    } catch (err) {
      const detail = eeaErrorMessage(err)
      setJobError(detail)
      messageApi.error(`${file.name}: ${detail}`)
    } finally {
      setBusy(false)
      if (!loadPendingCaptureJob()) {
        clearUploadProgress()
      }
    }
  }

  const onFiles = (list: FileList | File[]) => {
    const files = Array.from(list)
    if (!files.length || busy) return
    void (async () => {
      for (const file of files) {
        await handleBeforeUpload(file)
      }
    })()
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
        await finishJobSuccess(terminal)
      } else {
        setJobError(terminal.error?.trim() || '采集任务失败')
      }
    } catch (err) {
      const detail = eeaErrorMessage(err)
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

  return {
    pasteText,
    setPasteText,
    analysis,
    pasteHintId,
    busy,
    uploadInFlight,
    lastDocument,
    lastDocumentName,
    setLastDocument,
    panoramaBatch,
    fileJob: {
      uploadProgress,
      uploadProcessing,
      uploadFileName,
      jobStageLabel,
      jobError,
      activeJobId,
    },
    submitPastebin,
    onFiles,
    onRetryJob,
    onCancelJob,
  }
}

export function NewSignalImportPage({ onNavigate }: NewSignalImportProps) {
  const vm = useNewSignalImport(onNavigate)

  return (
    <div className="new-signal-import-page">
      <Row gutter={[18, 18]} className="new-signal-import-row">
        <Col xs={24} lg={16} className="new-signal-import-col new-signal-import-stack">
          <Card className="panel-card new-signal-import-card" title="导入证据">
            <div className="new-signal-import-form">
              <ImportUnifiedSurface
                pasteText={vm.pasteText}
                onPasteTextChange={vm.setPasteText}
                analysis={vm.analysis}
                pasteHintId={vm.pasteHintId}
                busy={vm.busy}
                uploadInFlight={vm.uploadInFlight}
                disabled={vm.busy}
                onSubmit={() => void vm.submitPastebin()}
                onNavigateSignals={() => onNavigate('signals')}
                onFiles={vm.onFiles}
              />
              {vm.lastDocument ? (
                <DocumentIngestResult
                  doc={vm.lastDocument}
                  filename={vm.lastDocumentName ?? undefined}
                  onUpdated={(detail) => vm.setLastDocument(detail)}
                  onNavigate={onNavigate}
                />
              ) : null}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8} className="new-signal-import-col new-signal-import-side-col">
          <div className="new-signal-import-side-stack">
            <Card className="panel-card new-signal-import-card new-signal-import-side" title="任务进度">
              <ImportProgressSide
                panoramaBatch={vm.panoramaBatch}
                fileJob={vm.fileJob}
                onRetryJob={() => void vm.onRetryJob()}
                onCancelJob={() => void vm.onCancelJob()}
              />
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  )
}