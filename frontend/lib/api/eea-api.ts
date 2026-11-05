import {
  eeaFetch,
  eeaFetchText,
  eeaPostFormData,
  documentCanonicalUrl,
  signalArchiveUrl,
  toQueryString,
  type UploadProgressHandler,
} from '@/lib/api/client'
import type {
  AccessLogOut,
  AssessmentOut,
  DemandOut,
  DocumentDetail,
  DocumentRawOut,
  LandingPointOut,
  ListSignalsParams,
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
  SignalCreatePayload,
  SignalUpdatePayload,
  SessionOut,
  SignalDetail,
  SignalFigureOut,
  SignalOut,
  TagAssignmentPayload,
  TagSuggestion,
  ThemeAssignmentPayload,
  ThemeCreatePayload,
  ThemeDetail,
  TraceChain,
  VocabOut,
  VocabUsageOut,
  AssistantChatTurn,
} from '@/lib/api/types'

export function fetchRefCodes(domain?: string) {
  return eeaFetch<RefCodeOut[]>(`/ref-codes${toQueryString({ domain })}`)
}

export function fetchOverview() {
  return eeaFetch<OverviewStats>('/overview')
}

export function fetchSignals(params: ListSignalsParams = {}) {
  return eeaFetch<SignalOut[]>(`/signals${toQueryString(params)}`)
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

export function fetchDemands() {
  return eeaFetch<DemandOut[]>('/demands')
}

export function fetchLandingPoints(vehicleFunctionId?: string) {
  return eeaFetch<LandingPointOut[]>(
    `/landing-points${toQueryString({ vehicle_function_id: vehicleFunctionId })}`,
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

export async function captureSignal(
  input: {
    url: string
    archiveHtml: Blob
    filename?: string
    channelCode?: string
  },
  options?: { onUploadProgress?: UploadProgressHandler },
) {
  const form = new FormData()
  form.set('url', input.url)
  if (input.channelCode) {
    form.set('channel_code', input.channelCode)
  }
  form.set(
    'archive_html',
    input.archiveHtml,
    input.filename ?? 'archive.html',
  )
  return eeaPostFormData<SignalDetail>('/signals/capture', form, options)
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

export type { AssistantChatTurn } from '@/lib/api/types'
export type { UploadProgressHandler } from '@/lib/api/client'
