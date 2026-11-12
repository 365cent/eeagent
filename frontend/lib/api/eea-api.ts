import {
  eeaFetch,
  eeaFetchBlob,
  eeaFetchText,
  eeaFetchWithMeta,
  eeaPostFormData,
  documentCanonicalUrl,
  signalArchiveUrl,
  toQueryString,
  EeaApiError,
  type UploadProgressHandler,
} from '@/lib/api/client'
import type {
  AccessLogOut,
  AssessmentOut,
  DemandOut,
  DocumentDetail,
  DocumentRawOut,
  LandingPointOut,
  LandingPointCreatePayload,
  LandingPointUpdatePayload,
  LandingPointStandardGrid,
  LandingPointStandardUpsert,
  ListSignalsParams,
  DataSyncStamp,
  OverviewStats,
  PanoramaStage,
  RefCodeOut,
  LlmStatus,
  SignalAssistantReply,
  StudioAudioPayload,
  StudioInfographicPayload,
  StudioMindmapPayload,
  SignalStudioKind,
  AuditOut,
  DemandAssistantReply,
  DemandCreatePayload,
  DemandDraftProposal,
  DemandUpdatePayload,
  SignalCreatePayload,
  SignalUpdatePayload,
  SessionOut,
  SignalDetail,
  SignalFigureOut,
  SignalOut,
  TagAssignmentPayload,
  TagSuggestion,
  ThemeAggregatePreview,
  ThemeAssignmentPayload,
  ThemeCreatePayload,
  ThemeDetail,
  TraceChain,
  VocabOut,
  VocabUsageOut,
  AssistantChatTurn,
  VehicleFunctionCreatePayload,
  VehicleFunctionOut,
  VehicleFunctionUpdatePayload,
  StrategyFunnelOut,
  StrategyFunnelPatchPayload,
  CaptureJobOut,
  CaptureResult,
  ChainReportOut,
  AgentSessionOut,
  AgentMessageRecord,
  AgentPatchOut,
  AgentMessageResponse,
  AgentSkillsStatusOut,
  AgentMemoryOut,
  DocumentFigureOut,
  DocumentKeywordOut,
  SignalsPage,
} from '@/lib/api/types'

export function fetchRefCodes(domain?: string) {
  return eeaFetch<RefCodeOut[]>(`/ref-codes${toQueryString({ domain })}`)
}

export function fetchOverview() {
  return eeaFetch<OverviewStats>('/overview')
}

export function fetchSyncStamp() {
  return eeaFetch<DataSyncStamp>('/sync-stamp')
}

export async function fetchSignalsPage(params: ListSignalsParams = {}): Promise<SignalsPage> {
  const { data, headers } = await eeaFetchWithMeta<SignalOut[]>(`/signals${toQueryString(params)}`)
  const items = Array.isArray(data) ? data : []
  const raw = headers.get('X-Total-Count')
  const parsed = raw ? Number.parseInt(raw, 10) : items.length
  return { items, total: Number.isFinite(parsed) ? parsed : items.length }
}

export function fetchSignals(params: ListSignalsParams = {}) {
  return fetchSignalsPage(params).then((page) => page.items)
}

export function fetchSignal(signalId: string) {
  return eeaFetch<SignalDetail>(`/signals/${signalId}`)
}

export function fetchThemes() {
  return eeaFetch<ThemeDetail[]>('/themes')
}

export function createTheme(payload: ThemeCreatePayload) {
  return eeaFetch<ThemeDetail>('/themes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function fetchVocabUsage(kind = 'tech_tag') {
  return eeaFetch<VocabUsageOut[]>(`/vocab/usage${toQueryString({ kind })}`)
}

export function fetchVocab(kind?: string) {
  return eeaFetch<VocabOut[]>(`/vocab${toQueryString({ kind })}`)
}

export function fetchCorrectionAudit(entityId?: string) {
  return eeaFetch<AuditOut[]>(`/audit${toQueryString({ entity_id: entityId })}`)
}

export function patchSignal(signalId: string, payload: SignalUpdatePayload) {
  return eeaFetch<SignalDetail>(`/signals/${encodeURIComponent(signalId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteSignal(signalId: string) {
  return eeaFetch<void>(`/signals/${encodeURIComponent(signalId)}`, {
    method: 'DELETE',
  })
}

export function fetchDemands() {
  return eeaFetch<DemandOut[]>('/demands')
}

export function createDemand(payload: DemandCreatePayload) {
  return eeaFetch<DemandOut>('/demands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function proposeDemandDraft(
  sourceTechThemeId: string,
  options?: { userHint?: string; useLlm?: boolean; selectedSignalIds?: string[] },
) {
  return eeaFetch<DemandDraftProposal>('/demands/assistant/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_tech_theme_id: sourceTechThemeId,
      user_hint: options?.userHint,
      use_llm: options?.useLlm ?? false,
      selected_signal_ids: options?.selectedSignalIds ?? [],
    }),
  })
}

export function postDemandAssistantMessage(
  sourceTechThemeId: string,
  message: string,
  history: AssistantChatTurn[] = [],
  selectedSignalIds: string[] = [],
) {
  return eeaFetch<DemandAssistantReply>('/demands/assistant/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_tech_theme_id: sourceTechThemeId,
      message,
      history,
      selected_signal_ids: selectedSignalIds,
    }),
  })
}

export function patchDemand(demandId: string, payload: DemandUpdatePayload) {
  return eeaFetch<DemandOut>(`/demands/${encodeURIComponent(demandId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function fetchVehicleFunctions(demandPointId?: string) {
  return eeaFetch<VehicleFunctionOut[]>(`/functions${toQueryString({ demand_point_id: demandPointId })}`)
}

export function createVehicleFunction(payload: VehicleFunctionCreatePayload) {
  return eeaFetch<VehicleFunctionOut>('/functions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function patchVehicleFunction(functionId: string, payload: VehicleFunctionUpdatePayload) {
  return eeaFetch<VehicleFunctionOut>(`/functions/${encodeURIComponent(functionId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function fetchLandingPoints(vehicleFunctionId?: string) {
  return eeaFetch<LandingPointOut[]>(
    `/landing-points${toQueryString({ vehicle_function_id: vehicleFunctionId })}`,
  )
}

export function createLandingPoint(payload: LandingPointCreatePayload) {
  return eeaFetch<LandingPointOut>('/landing-points', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function patchLandingPoint(landingPointId: string, payload: LandingPointUpdatePayload) {
  return eeaFetch<LandingPointOut>(`/landing-points/${encodeURIComponent(landingPointId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function fetchLandingPointStandards(landingPointId: string) {
  return eeaFetch<LandingPointStandardGrid>(
    `/landing-points/${encodeURIComponent(landingPointId)}/standards`,
  )
}

export function putLandingPointStandard(landingPointId: string, payload: LandingPointStandardUpsert) {
  return eeaFetch<LandingPointStandardGrid>(
    `/landing-points/${encodeURIComponent(landingPointId)}/standards`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
}

export function fetchAssessments(params?: { lp_id?: string; current_only?: boolean }) {
  return eeaFetch<AssessmentOut[]>(
    `/strategy/assessments${toQueryString({
      lp_id: params?.lp_id,
      current_only: params?.current_only ?? true,
    })}`,
  )
}

export function fetchStrategyFunnel(landingPointId: string) {
  return eeaFetch<StrategyFunnelOut>(
    `/strategy/landing-points/${encodeURIComponent(landingPointId)}/funnel`,
  )
}

export function patchStrategyFunnel(landingPointId: string, payload: StrategyFunnelPatchPayload) {
  return eeaFetch<StrategyFunnelOut>(
    `/strategy/landing-points/${encodeURIComponent(landingPointId)}/funnel`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
}

export function fetchStrategyAssessmentHistory(landingPointId: string) {
  return eeaFetch<AssessmentOut[]>(
    `/strategy/landing-points/${encodeURIComponent(landingPointId)}/assessments/history`,
  )
}

export function fetchPanorama() {
  return eeaFetch<PanoramaStage[]>('/panorama')
}

export function fetchTraceFromLandingPoint(lpId: string) {
  return eeaFetch<TraceChain>(`/trace/landing-points/${lpId}`)
}

export function fetchSignalBody(signalId: string) {
  return eeaFetchText(`/signals/${encodeURIComponent(signalId)}/body`)
}

export function fetchSignalFigures(signalId: string) {
  return eeaFetch<SignalFigureOut[]>(`/signals/${encodeURIComponent(signalId)}/figures`)
}

export { documentCanonicalUrl, signalArchiveUrl }

export function createSignal(payload: SignalCreatePayload) {
  return eeaFetch<SignalDetail>('/signals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export type CreateCaptureJobInput = {
  file: File | Blob
  filename: string
  submissionId: string
  url?: string
  channelCode?: string
  publisher?: string
  sourceLabel?: string
}

const CAPTURE_JOB_POLL_MS = 2000

export async function createCaptureJob(
  input: CreateCaptureJobInput,
  options?: { onUploadProgress?: UploadProgressHandler },
): Promise<CaptureJobOut> {
  const form = new FormData()
  form.set('submission_id', input.submissionId)
  if (input.url) {
    form.set('url', input.url)
  }
  if (input.channelCode) {
    form.set('channel_code', input.channelCode)
  }
  if (input.publisher) {
    form.set('publisher', input.publisher)
  }
  if (input.sourceLabel) {
    form.set('source_label', input.sourceLabel)
  }
  form.set('file', input.file, input.filename)
  return eeaPostFormData<CaptureJobOut>('/capture/jobs', form, options)
}

export function getCaptureJob(jobId: string) {
  return eeaFetch<CaptureJobOut>(`/capture/jobs/${encodeURIComponent(jobId)}`)
}

export function retryCaptureJob(jobId: string) {
  return eeaFetch<CaptureJobOut>(`/capture/jobs/${encodeURIComponent(jobId)}/retry`, {
    method: 'POST',
  })
}

export function cancelCaptureJob(jobId: string) {
  return eeaFetch<CaptureJobOut>(`/capture/jobs/${encodeURIComponent(jobId)}/cancel`, {
    method: 'POST',
  })
}

export function captureJobStageLabel(stage: CaptureJobOut['stage'], status: CaptureJobOut['status']): string {
  if (status === 'failed') return '处理失败'
  if (status === 'cancelled') return '已取消'
  if (status === 'succeeded') return '已完成'
  switch (stage) {
    case 'fetching':
      return '抓取页面…'
    case 'processing':
      return '解析入库…'
    case 'queued':
    default:
      return '排队等待…'
  }
}

export async function pollCaptureJob(
  jobId: string,
  options?: {
    signal?: AbortSignal
    onUpdate?: (job: CaptureJobOut) => void
    pollIntervalMs?: number
  },
): Promise<CaptureJobOut> {
  const interval = options?.pollIntervalMs ?? CAPTURE_JOB_POLL_MS
  while (true) {
    if (options?.signal?.aborted) {
      throw new EeaApiError(0, '轮询已中止')
    }
    const job = await getCaptureJob(jobId)
    options?.onUpdate?.(job)
    if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled') {
      return job
    }
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, interval)
      const onAbort = () => {
        clearTimeout(timer)
        reject(new EeaApiError(0, '轮询已中止'))
      }
      options?.signal?.addEventListener('abort', onAbort, { once: true })
    })
  }
}

export async function runCaptureJobUntilResult(
  input: CreateCaptureJobInput,
  options?: {
    onUploadProgress?: UploadProgressHandler
    onJobUpdate?: (job: CaptureJobOut) => void
    signal?: AbortSignal
  },
): Promise<CaptureResult> {
  const accepted = await createCaptureJob(input, { onUploadProgress: options?.onUploadProgress })
  const terminal = await pollCaptureJob(accepted.id, {
    signal: options?.signal,
    onUpdate: options?.onJobUpdate,
  })
  if (terminal.status === 'cancelled') {
    throw new EeaApiError(409, '采集任务已取消')
  }
  if (terminal.status === 'failed') {
    throw new EeaApiError(422, terminal.error?.trim() || '采集任务失败')
  }
  if (!terminal.result?.signal?.id) {
    throw new EeaApiError(500, '任务已完成但未返回信号结果')
  }
  return terminal.result
}

/** @deprecated Prefer runCaptureJobUntilResult for durable ingest. */
export async function captureSignal(
  input: {
    url: string
    archiveHtml: Blob
    filename?: string
    channelCode?: string
  },
  options?: { onUploadProgress?: UploadProgressHandler },
) {
  const submissionId = crypto.randomUUID()
  const result = await runCaptureJobUntilResult(
    {
      file: input.archiveHtml,
      filename: input.filename ?? 'archive.html',
      submissionId,
      url: input.url,
      channelCode: input.channelCode,
    },
    options,
  )
  return result.signal
}

export async function importCaptureUrlList(text: string) {
  return eeaFetch<import('@/lib/api/types').PanoramaImportBatchOut>('/imports/capture-urls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

export function fetchPanoramaImportBatch(batchId: string) {
  return eeaFetch<import('@/lib/api/types').PanoramaImportBatchOut>(
    `/imports/panorama/${encodeURIComponent(batchId)}`,
  )
}

export async function uploadRawDocument(
  file: File,
  options?: { onUploadProgress?: UploadProgressHandler },
) {
  const form = new FormData()
  form.set('file', file, file.name)
  return eeaPostFormData<DocumentRawOut>('/documents/raw', form, options)
}

export function fetchDocument(documentId: string) {
  return eeaFetch<DocumentDetail>(`/documents/${encodeURIComponent(documentId)}`)
}

export function fetchDocumentCanonicalMd(documentId: string) {
  return eeaFetchText(`/documents/${encodeURIComponent(documentId)}/canonical.md`, {
    headers: { Accept: 'text/markdown, text/plain, */*' },
  })
}

export function reingestDocument(documentId: string) {
  return eeaFetch<DocumentDetail>(`/documents/${encodeURIComponent(documentId)}/ingest`, {
    method: 'POST',
  })
}

function inferChannelFromUrl(rawUrl: string): string {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase()
    if (host === 'mp.weixin.qq.com' || host.endsWith('.weixin.qq.com')) {
      return 'wechat_mp'
    }
  } catch {
    /* ignore */
  }
  return 'web'
}

export function inferChannelCode(rawUrl: string): string {
  return inferChannelFromUrl(rawUrl)
}

/** Stable provenance URL for a raw upload linked as a signal (no public http source). */
export function documentEvidenceUrl(documentId: string): string {
  return `eea://document/${documentId}`
}

export function postSignalAssistantMessage(
  signalId: string,
  message: string,
  history: AssistantChatTurn[] = [],
) {
  return eeaFetch<SignalAssistantReply>(
    `/signals/${encodeURIComponent(signalId)}/assistant/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    },
  )
}

export async function fetchSignalStudio(
  signalId: string,
  kind: SignalStudioKind,
): Promise<StudioAudioPayload | StudioMindmapPayload | StudioInfographicPayload | string> {
  const path = `/signals/${encodeURIComponent(signalId)}/studio`
  if (kind === 'report') {
    return eeaFetchText(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/markdown, text/plain, */*' },
      body: JSON.stringify({ kind }),
    })
  }
  return eeaFetch<StudioAudioPayload | StudioMindmapPayload | StudioInfographicPayload>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind }),
  })
}

export function fetchLlmStatus() {
  return eeaFetch<LlmStatus>('/llm/status')
}

export function fetchSignalTagSuggestions(signalId: string) {
  return eeaFetch<TagSuggestion>(`/signals/${encodeURIComponent(signalId)}/tag-suggestions`)
}

export function putSignalTags(signalId: string, payload: TagAssignmentPayload) {
  return eeaFetch<SignalDetail>(`/signals/${encodeURIComponent(signalId)}/tags`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function putSignalTheme(signalId: string, payload: ThemeAssignmentPayload) {
  return eeaFetch<SignalDetail>(`/signals/${encodeURIComponent(signalId)}/theme`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function postSignalAutoAggregate(signalId: string) {
  return eeaFetch<SignalDetail>(`/signals/${encodeURIComponent(signalId)}/auto-aggregate`, {
    method: 'POST',
  })
}

export function fetchThemeAggregatePreview(signalId: string) {
  return eeaFetch<ThemeAggregatePreview>(
    `/signals/${encodeURIComponent(signalId)}/theme-aggregate-preview`,
  )
}

export function recordVisit(page?: string) {
  return eeaFetch<AccessLogOut>('/session/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page: page ?? null }),
  })
}

export function fetchAccessHistory(limit = 20) {
  return eeaFetch<AccessLogOut[]>(`/session/history?limit=${limit}`)
}

export function fetchSessionMe() {
  return eeaFetch<SessionOut>('/session/me')
}

export function fetchDocumentFigures(documentId: string) {
  return eeaFetch<DocumentFigureOut[]>(`/documents/${encodeURIComponent(documentId)}/figures`)
}

export function fetchDocumentKeywords(documentId: string) {
  return eeaFetch<DocumentKeywordOut[]>(`/documents/${encodeURIComponent(documentId)}/keywords`)
}

export function extractDocumentKeywords(documentId: string) {
  return eeaFetch<DocumentKeywordOut[]>(`/documents/${encodeURIComponent(documentId)}/extract-keywords`, {
    method: 'POST',
  })
}

export function listChainReports() {
  return eeaFetch<ChainReportOut[]>('/reports')
}

export function createChainReport(payload: {
  demand_point_id?: string
  landing_point_id?: string
  format?: 'md' | 'pdf'
}) {
  return eeaFetch<ChainReportOut>('/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function downloadChainReportMarkdown(reportId: string) {
  return eeaFetchText(`/reports/${encodeURIComponent(reportId)}/download?format=md`)
}

export function downloadChainReportPdf(reportId: string) {
  return eeaFetchBlob(`/reports/${encodeURIComponent(reportId)}/download?format=pdf`)
}

export function fetchAgentSkillsStatus() {
  return eeaFetch<AgentSkillsStatusOut>('/agent/skills/status')
}

export function listAgentSessions() {
  return eeaFetch<AgentSessionOut[]>('/agent/sessions')
}

export function createAgentSession(payload: {
  title?: string
  project_key?: string
  page_context?: Record<string, unknown>
}) {
  return eeaFetch<AgentSessionOut>('/agent/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function listAgentSessionMessages(sessionId: string) {
  return eeaFetch<AgentMessageRecord[]>(`/agent/sessions/${encodeURIComponent(sessionId)}/messages`)
}

export function listAgentSessionPatches(sessionId: string) {
  return eeaFetch<AgentPatchOut[]>(`/agent/sessions/${encodeURIComponent(sessionId)}/patches`)
}

export function postAgentSessionMessage(sessionId: string, message: string) {
  return eeaFetch<AgentMessageResponse>(`/agent/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
}

export function cancelAgentRun(sessionId: string, runId: string) {
  return eeaFetch<{ run_id: string; status: string }>(
    `/agent/sessions/${encodeURIComponent(sessionId)}/runs/${encodeURIComponent(runId)}/cancel`,
    { method: 'POST' },
  )
}

export function confirmAgentPatch(sessionId: string, patchId: string) {
  return eeaFetch<{ patch_id: string; status: string; message: string }>(
    `/agent/sessions/${encodeURIComponent(sessionId)}/patches/${encodeURIComponent(patchId)}/confirm`,
    { method: 'POST' },
  )
}

export function rejectAgentPatch(sessionId: string, patchId: string) {
  return eeaFetch<{ patch_id: string; status: string; message: string }>(
    `/agent/sessions/${encodeURIComponent(sessionId)}/patches/${encodeURIComponent(patchId)}/reject`,
    { method: 'POST' },
  )
}

export function listAgentMemories() {
  return eeaFetch<AgentMemoryOut[]>('/agent/memories')
}

export function deleteAgentMemory(memoryId: string) {
  return eeaFetch<void>(`/agent/memories/${encodeURIComponent(memoryId)}`, { method: 'DELETE' })
}

export type { AssistantChatTurn } from '@/lib/api/types'
export type { UploadProgressHandler } from '@/lib/api/client'
