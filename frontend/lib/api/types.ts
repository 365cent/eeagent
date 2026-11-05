/** Subset of backend OpenAPI models used by the dashboard. */

export type RefCodeOut = {
  domain: string
  code: string
  label: string
  fixture_alias?: string | null
}

export type SignalOut = {
  id: string
  title: string
  url: string
  url_normalized: string
  channel_code: string
  publisher: string | null
  published_at: string | null
  value_chain_stage_code: string | null
  signal_type_code: string | null
  evolution_node_code: string | null
  evidence_status_code: string
  tech_theme_id: string | null
  document_id?: string | null
  source_label: string | null
  excerpt: string | null
  captured_at: string | null
  created_at: string
  updated_at: string
  tags?: string[]
}

export type LinkedDemandPoint = {
  id: string
  name: string
  value_chain_stage_code: string
  review_status: string | null
  source_tech_theme_id: string | null
}

export type SignalDetail = SignalOut & {
  body_object_key?: string | null
  body_sha256?: string | null
  snapshot_html_object_key?: string | null
  theme?: ThemeOut | null
  linked_demand_points?: LinkedDemandPoint[]
}

export type SignalFigureOut = {
  index: number
  mime: string
  src: string
}

export type DocumentIngestStatus = 'stored' | 'parsed' | 'failed' | 'skipped'

export type DocumentRawOut = {
  id: string
  sha256: string
  mime: string
  size: number
  filename?: string | null
  ingest_status: DocumentIngestStatus | string
  markitdown_version?: string | null
  vision_model?: string | null
  figure_count?: number
  canonical_md_excerpt?: string | null
}

export type DocumentDetail = DocumentRawOut & {
  created_at: string
  ingested_at?: string | null
  has_canonical: boolean
  ingest_error?: string | null
}

export type SignalCreatePayload = {
  title?: string | null
  url?: string | null
  document_id?: string
  channel_code: string
  publisher?: string | null
  body_text?: string | null
  excerpt?: string | null
  evidence_status_code?: string
}

export type TagAssignmentPayload = {
  tag_names: string[]
  operator_subject?: string
}

export type ThemeAssignmentPayload = {
  tech_theme_id: string | null
  operator_subject?: string
}

export type SignalUpdatePayload = {
  value_chain_stage_code?: string | null
  signal_type_code?: string | null
  operator_subject?: string
  operator_role?: string
}

export type TagSuggestion = {
  suggested_tags: string[]
  source: string
  /** Optional scores when backend T1 adds them; current API omits these. */
  freq?: number | null
  embed_score?: number | null
  rerank_score?: number | null
}

export type AuditValue = Record<string, unknown> | unknown[] | string | null

export type AuditOut = {
  id: string
  entity_type: string
  entity_id: string
  field_name: string
  machine_value: AuditValue
  human_value: AuditValue
  operator_subject: string
  operator_role: string
  corrected_at: string
}

export type VocabUsageOut = {
  id: string
  kind: string
  name: string
  frequency: number
}

export type VocabOut = {
  id: string
  kind: string
  name: string
  created_at?: string
}

export type ThemeCreatePayload = {
  working_name: string
  value_chain_stage_code?: string | null
}

export type AssistantChatTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type SignalAssistantReply = {
  signal_id: string
  reply: string
  model: string | null
}

export type SignalStudioKind = 'audio' | 'mindmap' | 'report' | 'infographic'

export type StudioAudioSegment = { text: string; quote: string }

export type StudioAudioPayload = { segments: StudioAudioSegment[] }

export type StudioMindmapNode = { label: string; children?: StudioMindmapNode[] }

export type StudioMindmapPayload = { title: string; children: StudioMindmapNode[] }

export type StudioInfographicPayload = {
  headline: string
  stats: { label: string; value: string }[]
  points: { title: string; body: string }[]
}

export type LlmStatus = {
  configured: boolean
  model: string | null
}

export type ThemeOut = {
  id: string
  working_name: string
  value_chain_stage_code: string | null
  created_at: string
}

export type ThemeMetrics = {
  theme_id: string
  signal_frequency: number
  source_count: number
}

export type ThemeDetail = ThemeOut & {
  metrics?: ThemeMetrics | null
  display_tags?: string[]
}

export type OverviewStats = {
  signals: number
  signals_pending_review: number
  tech_themes: number
  demand_points: number
  vehicle_functions: number
  landing_points: number
  funnel_pool: number
}

export type DemandOut = {
  id: string
  name: string
  source_tech_theme_id: string | null
  value_chain_stage_code: string
  cross_validation: Record<string, unknown> | null
  time_series: unknown[] | null
  review_status: string | null
  created_at: string
  function_count?: number
  signal_frequency?: number
  source_count?: number
}

export type LandingPointOut = {
  id: string
  vehicle_function_id: string
  domain_vocab_id: string
  name: string
  role_description: string | null
  created_at: string
  domain_name?: string
  standard_count?: number
}

export type AssessmentOut = {
  id: string
  tech_landing_point_id: string
  version: number
  funnel_step: number
  score_business: number
  score_maturity: number
  score_moat: number
  score_supply_chain: number
  score_feasibility: number
  score_total: number
  classification: string
  strategy_note: string | null
  operator_subject: string | null
  assessed_at: string
  is_current: boolean
}

export type PanoramaLandingPoint = {
  id: string
  name: string
  domain_name: string
  standard_count: number
}

export type PanoramaFunction = {
  id: string
  name: string
  landing_points: PanoramaLandingPoint[]
}

export type PanoramaDemandPoint = {
  id: string
  name: string
  functions: PanoramaFunction[]
}

export type PanoramaStage = {
  stage_code: string
  stage_label: string
  demand_count: number
  function_count: number
  landing_point_count: number
  demand_points: PanoramaDemandPoint[]
}

export type TraceChain = {
  landing_point: LandingPointOut
  standards: unknown[]
  assessment: AssessmentOut | null
  vehicle_function: { id: string; name: string } | null
  demand_point: DemandOut | null
  theme: ThemeOut | null
  signals: SignalOut[]
}

export type ListSignalsParams = {
  keyword?: string
  value_chain_stage?: string
  channel?: string
  evidence_status?: string
  theme_id?: string
  limit?: number
  offset?: number
}

export type AccessLogOut = {
  id: string
  ip: string
  ua_browser: string
  ua_os: string
  page: string | null
  created_at: string
}

export type SessionOut = {
  ip: string
  ua_browser: string
  ua_os: string
  visits: number
  first_seen: string | null
  last_seen: string | null
}
