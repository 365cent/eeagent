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

export type CaptureJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'

export type CaptureJobStage =
  | 'queued'
  | 'fetching'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type CaptureResult = {
  source: string
  via: string
  signal: SignalDetail
  document: DocumentRawOut | null
}

export type CaptureJobOut = {
  id: string
  submission_id: string
  status: CaptureJobStatus
  stage: CaptureJobStage
  attempt_count: number
  created_at: string
  updated_at: string
  started_at?: string | null
  heartbeat_at?: string | null
  finished_at?: string | null
  signal_id?: string | null
  error?: string | null
  result?: CaptureResult | null
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
}

export type ThemeAssignmentPayload = {
  tech_theme_id: string | null
}

export type SignalUpdatePayload = {
  value_chain_stage_code?: string | null
  signal_type_code?: string | null
}

export type TagSuggestion = {
  suggested_tags: string[]
  value_chain_stage_code: string | null
  signal_type_code: string | null
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
  old_value: AuditValue
  new_value: AuditValue
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
  signals_retained?: number
  signals_fetching?: number
  signals_fetch_failed?: number
  signals_archived?: number
  tech_themes: number
  demand_points: number
  vehicle_functions: number
  landing_points: number
  funnel_pool: number
  signal_sources?: number
  demand_points_pending_review?: number
  capture_jobs_open?: number
  capture_jobs_failed?: number
  documents_failed_ingest?: number
  substantive_standards?: number
  weekly_window_start_utc?: string
  as_of_utc?: string
  weekly_new?: {
    signals: number
    tech_themes: number
    demand_points: number
    vehicle_functions: number
    landing_points: number
    strategic_assessments: number
    documents: number
  }
  strategy_funnel?: {
    industry_scan: number
    tier1_adaptation: number
    scoring: number
    classification: number
    rejected: number
    pool_entry_blocked: number
  }
}

export type DemandOut = {
  id: string
  name: string
  source_tech_theme_id: string | null
  value_chain_stage_code: string
  derivation_trace: DemandDerivationTrace | null
  cross_validation: Record<string, unknown> | null
  time_series: unknown[] | null
  review_status: string | null
  created_at: string
  function_count?: number
  signal_frequency?: number
  source_count?: number
}

export type DemandDerivationStepKey =
  | 'fact_identification'
  | 'frequency_consensus'
  | 'similarity_analysis'
  | 'stakeholder_attribution'
  | 'demand_naming'

export type DemandDerivationStep = {
  key: DemandDerivationStepKey
  content: string
  evidence_signal_ids: string[]
}

export type DemandDerivationTrace = {
  steps: DemandDerivationStep[]
}

export type DemandCreatePayload = {
  name: string
  source_tech_theme_id: string
  value_chain_stage_code: string
  derivation_trace: DemandDerivationTrace
  cross_validation: Record<string, unknown> | null
  time_series: unknown[]
  review_status: 'pending'
}

export type DemandUpdatePayload = Partial<Omit<DemandCreatePayload, 'review_status'>> & {
  review_status?: string | null
}

export type VehicleFunctionOut = {
  id: string
  demand_point_id: string
  name: string
  value_chain_stage_code: string | null
  forward_trace: Record<string, unknown> | null
  reverse_trace: Record<string, unknown> | null
  recommendation_level: string | null
  automation_levels: string[] | null
  target_domain: string | null
  recommendation_reason: string | null
  l2_l4_difference: string | null
  published: boolean
  created_at: string
}

export type VehicleFunctionCreatePayload = {
  demand_point_id: string
  name: string
  forward_trace: Record<string, unknown>
  reverse_trace: Record<string, unknown> | null
  recommendation_level: string | null
  automation_levels: string[]
  target_domain: string | null
  recommendation_reason: string | null
  l2_l4_difference: string | null
}

export type VehicleFunctionUpdatePayload = Partial<Omit<VehicleFunctionCreatePayload, 'demand_point_id'>> & {
  published?: boolean
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

export type LandingPointCreatePayload = {
  vehicle_function_id: string
  domain: string
  name: string
  role_description: string | null
}

export type LandingPointUpdatePayload = {
  name?: string
  domain?: string
  role_description?: string | null
}

export type LandingPointStandardPhase = '设计' | '制造' | '运营'

export type LandingPointStandardConstraint = '工程化' | '经济性' | '安全合规'

export type LandingPointStandardOut = {
  id: string
  tech_landing_point_id: string
  phase: LandingPointStandardPhase
  constraint_type: LandingPointStandardConstraint
  requirement_text: string | null
}

export type LandingPointStandardGrid = {
  cells: LandingPointStandardOut[]
}

export type LandingPointStandardUpsert = {
  phase: LandingPointStandardPhase
  constraint_type: LandingPointStandardConstraint
  requirement_text: string | null
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
  score_rationales: StrategyScoreRationales | null
  funnel_snapshot: StrategyFunnelSnapshot | null
}

export type StrategyClassification = '前瞻布局' | '短期可落地' | '产业投资/生态合作'

export type StrategyFunnelCurrentStep =
  | 'pool_entry_blocked'
  | 'industry_scan'
  | 'tier1_adaptation'
  | 'scoring'
  | 'classification'
  | 'ready_to_finalize'
  | 'rejected'
  | 'complete'

export type StrategyScoreDimension = 'business' | 'maturity' | 'moat' | 'supply_chain' | 'feasibility'

export type StrategyScoreDraft = {
  score: number | null
  rationale: string | null
}

export type StrategyScoreDrafts = Record<StrategyScoreDimension, StrategyScoreDraft>

export type StrategyScoreRationales = Record<StrategyScoreDimension, string>

export type StrategyFunnelSnapshot = {
  scan_scope: string | null
  scan_sources: string[] | null
  deployment_boundary_evidence_ids: string[]
  tier1_current_business_relation: string | null
  tier1_future_business_relation: string | null
  valuable_role: string | null
  adaptation_decision: 'pass' | 'reject' | null
  adaptation_reason: string | null
  score_drafts: StrategyScoreDrafts
  classification: StrategyClassification | null
  strategy_note: string | null
}

export type StrategyFunnelOut = {
  tech_landing_point_id: string
  current_step: StrategyFunnelCurrentStep
  pool_eligible: boolean
  deployment_boundary_evidence_ids: string[]
  scan_scope: string | null
  scan_sources: string[]
  tier1_current_business_relation: string | null
  tier1_future_business_relation: string | null
  valuable_role: string | null
  adaptation_decision: 'pass' | 'reject' | null
  adaptation_reason: string | null
  score_drafts: StrategyScoreDrafts
  score_total: number | null
  classification: StrategyClassification | null
  strategy_note: string | null
  finalized_assessment_id: string | null
  finalized_at: string | null
  updated_by: string | null
  updated_at: string | null
  latest_assessment: AssessmentOut | null
}

/** Flat PATCH payload; the server validates stage order and owns the funnel state. */
export type StrategyFunnelPatchPayload = {
  scan_scope?: string | null
  scan_sources?: string[] | null
  tier1_current_business_relation?: string | null
  tier1_future_business_relation?: string | null
  valuable_role?: string | null
  adaptation_decision?: 'pass' | 'reject' | null
  adaptation_reason?: string | null
  score_business?: number | null
  rationale_business?: string | null
  score_maturity?: number | null
  rationale_maturity?: string | null
  score_moat?: number | null
  rationale_moat?: string | null
  score_supply_chain?: number | null
  rationale_supply_chain?: string | null
  score_feasibility?: number | null
  rationale_feasibility?: string | null
  classification?: StrategyClassification | null
  strategy_note?: string | null
  finalize?: boolean
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
  standards: LandingPointStandardOut[]
  assessment: AssessmentOut | null
  assessment_versions: AssessmentOut[]
  vehicle_function: VehicleFunctionOut | null
  demand_point: DemandOut | null
  theme: ThemeOut | null
  signals: TraceSignalOut[]
  demand_review_status: string | null
  demand_cross_validation_conclusion: string | null
  function_published: boolean | null
  basis_freshness: 'unknown_untracked'
  completeness: TraceCompleteness
}

export type TraceDocumentOut = {
  id: string
  filename: string | null
  mime: string
  size: number
  sha256: string
  ingest_status: string
  figure_count: number
  created_at: string
  raw_object_reference_present: boolean
  canonical_object_reference_present: boolean
  endpoint: string
}

export type TraceSignalOut = SignalOut & {
  trace_relationships: Array<'theme_member' | 'demand_evidence'>
  body_reference_present: boolean
  archive_reference_present: boolean
  is_archived: boolean
  body_endpoint: string | null
  archive_endpoint: string | null
  figures_endpoint: string | null
  document: TraceDocumentOut | null
}

export type TraceCompleteness = {
  complete: boolean
  present_stages: Array<'landing_point' | 'vehicle_function' | 'demand_point' | 'theme' | 'signals'>
  missing_stages: Array<'landing_point' | 'vehicle_function' | 'demand_point' | 'theme' | 'signals'>
  unresolved_evidence_signal_ids: string[]
  unresolved_document_ids: string[]
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
