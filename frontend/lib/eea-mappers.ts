import type {
  AssessmentOut,
  DemandOut,
  LandingPointOut,
  OverviewStats,
  RefCodeOut,
  SignalOut,
  ThemeDetail,
} from '@/lib/api/types'
import type { Signal } from '@/types/platform'

export type RefCodeMaps = {
  byDomain: Record<string, Record<string, string>>
  labelToCode: Record<string, Record<string, string>>
}

export function buildRefCodeMaps(codes: RefCodeOut[]): RefCodeMaps {
  const byDomain: Record<string, Record<string, string>> = {}
  const labelToCode: Record<string, Record<string, string>> = {}

  for (const row of codes) {
    if (!byDomain[row.domain]) {
      byDomain[row.domain] = {}
      labelToCode[row.domain] = {}
    }
    byDomain[row.domain][row.code] = row.label
    labelToCode[row.domain][row.label] = row.code
    if (row.fixture_alias) {
      labelToCode[row.domain][row.fixture_alias] = row.code
    }
  }

  return { byDomain, labelToCode }
}

export function labelFor(maps: RefCodeMaps, domain: string, code: string | null | undefined): string {
  if (!code) return '—'
  return maps.byDomain[domain]?.[code] ?? code
}

/** UI filter chips use short names like「创造端」; API labels may include parentheses. */
export function shortStageLabel(fullLabel: string): string {
  const idx = fullLabel.indexOf('（')
  return idx >= 0 ? fullLabel.slice(0, idx) : fullLabel
}

export function formatApiDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

export function mapSignalOut(row: SignalOut, maps: RefCodeMaps): Signal {
  const stageLabel = labelFor(maps, 'value_chain_stage', row.value_chain_stage_code)
  const typeLabel = labelFor(maps, 'signal_type', row.signal_type_code)
  const statusLabel = labelFor(maps, 'evidence_status', row.evidence_status_code)
  const channelLabel = labelFor(maps, 'channel', row.channel_code)

  return {
    key: row.id,
    title: row.title,
    publisher: row.publisher ?? row.source_label ?? '—',
    channel: channelLabel,
    stage: shortStageLabel(stageLabel),
    type: typeLabel,
    status: statusLabel,
    date: formatApiDate(row.published_at ?? row.updated_at),
    tags: row.tags ?? [],
    urlDuplicateRenamed: row.url_duplicate_renamed === true,
  }
}

export type OverviewThemeRow = {
  id: string
  name: string
  note: string
  count: number
  sources: number
  progress: number
  color: string
}

const themeColors = ['#2563eb', '#0f766e', '#d97706', '#7c3aed', '#0891b2']

export function mapThemeToOverviewRow(theme: ThemeDetail, index: number, maps: RefCodeMaps): OverviewThemeRow {
  const freq = theme.metrics?.signal_frequency ?? 0
  const sources = theme.metrics?.source_count ?? 0
  const stage = theme.value_chain_stage_code
    ? shortStageLabel(labelFor(maps, 'value_chain_stage', theme.value_chain_stage_code))
    : ''
  const tagNote = theme.display_tags?.length ? theme.display_tags.join(' · ') : ''
  const note = tagNote || (stage ? `${stage} · 多源信号聚合` : '多源信号聚合')

  return {
    id: theme.id,
    name: theme.working_name,
    note,
    count: freq,
    sources,
    progress: Math.min(100, Math.max(18, freq * 12 + sources * 4)),
    color: themeColors[index % themeColors.length],
  }
}

export type DemandRow = {
  key: string
  name: string
  stage: string
  evidence: string
  signals: number
  sources: number
  functions: number
  status: string
}

export function mapDemandRow(row: DemandOut, maps: RefCodeMaps): DemandRow {
  const stageLabel = labelFor(maps, 'value_chain_stage', row.value_chain_stage_code)
  let evidence = '等待交叉验证'
  if (row.cross_validation && Object.keys(row.cross_validation).length > 0) {
    evidence = '跨主体交叉验证通过'
  }
  const status =
    row.review_status === 'confirmed'
      ? '已复核'
      : row.review_status === 'pending'
        ? '待复核'
        : row.review_status ?? '待复核'

  return {
    key: row.id,
    name: row.name,
    stage: shortStageLabel(stageLabel),
    evidence,
    signals: row.signal_frequency ?? 0,
    sources: row.source_count ?? 0,
    functions: row.function_count ?? 0,
    status,
  }
}

export type LandingRow = {
  key: string
  name: string
  domain: string
  role: string
  standards: number
  score: number | null
  category: string | null
}

export function mapLandingRow(
  row: LandingPointOut,
  assessment: AssessmentOut | undefined,
): LandingRow {
  return {
    key: row.id,
    name: row.name,
    domain: row.domain_name || '—',
    role: row.role_description ?? '—',
    standards: row.standard_count ?? 0,
    score: assessment?.score_total ?? null,
    category: assessment?.classification ?? null,
  }
}

export type FunnelStep = {
  id: string
  stepClass: string
  label: string
  value: string
  view: string
  query: Record<string, string>
  hash: string
}

const funnelStepMeta = [
  { id: 'scan', stepClass: 'step-one', label: '01 · 行业全景扫描', view: 'signals', query: { funnel: 'scan' }, hash: 'pool-scan' },
  { id: 'filter', stepClass: 'step-two', label: '02 · 战略适配过滤', view: 'strategy', query: { funnel: 'filter' }, hash: 'stage-filter' },
  { id: 'evaluate', stepClass: 'step-three', label: '03 · 五维综合研判', view: 'strategy', query: { funnel: 'evaluate' }, hash: 'stage-evaluate' },
  { id: 'classify', stepClass: 'step-four', label: '04 · 落地策略分类', view: 'strategy', query: { funnel: 'classify' }, hash: 'stage-classify' },
] as const

export function overviewToFunnelSteps(stats: OverviewStats): FunnelStep[] {
  const values = [
    stats.signals,
    stats.demand_points,
    stats.landing_points,
    stats.funnel_pool,
  ]
  return funnelStepMeta.map((step, index) => ({
    ...step,
    value: String(values[index] ?? 0),
  }))
}

/** Landing-point pipeline counts for the overview funnel card (matches strategy workbench stages). */
export function strategyFunnelToFunnelSteps(funnel: NonNullable<OverviewStats['strategy_funnel']>): FunnelStep[] {
  const values = [
    funnel.industry_scan,
    funnel.tier1_adaptation,
    funnel.scoring,
    funnel.classification,
  ]
  return funnelStepMeta.map((step, index) => ({
    ...step,
    value: String(values[index] ?? 0),
  }))
}

export function overviewToTraceMetrics(stats: OverviewStats) {
  return [
    { label: '原始信号', value: String(stats.signals) },
    { label: '需求点', value: String(stats.demand_points) },
    { label: '车辆功能', value: String(stats.vehicle_functions) },
    { label: '技术落脚点', value: String(stats.landing_points) },
  ] as const
}
