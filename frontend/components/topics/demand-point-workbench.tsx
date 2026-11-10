'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { App as AntApp, Alert, Button, Card, Collapse, Input, Select, Space, Spin, Table, Tag, Typography } from 'antd'
import { DemandDraftAssistant } from '@/components/topics/demand-draft-assistant'
import { DemandSignalLibrary } from '@/components/topics/demand-signal-library'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { EeaApiError } from '@/lib/api/client'
import { createDemand, fetchDemands, fetchRefCodes, fetchSignals, fetchThemes, patchDemand } from '@/lib/api/eea-api'
import type {
  DemandCreatePayload,
  DemandDerivationStep,
  DemandDerivationStepKey,
  DemandDraftProposal,
  DemandOut,
  DemandUpdatePayload,
  SignalOut,
  ThemeDetail,
} from '@/lib/api/types'
import { eeaQueryKeys, useRefCodeMaps } from '@/hooks/use-eea-queries'
import { labelFor } from '@/lib/eea-mappers'

const { Text } = Typography
const { TextArea } = Input

const DEMAND_STEPS: Array<{ key: DemandDerivationStepKey; label: string }> = [
  { key: 'fact_identification', label: '事实识别' },
  { key: 'frequency_consensus', label: '频率与共识判断' },
  { key: 'similarity_analysis', label: '相似性聚类' },
  { key: 'stakeholder_attribution', label: '利益相关方归因' },
  { key: 'demand_naming', label: '需求抽象与命名' },
]

type TimeSeriesDraft = {
  time: string
  event: string
  extra: Record<string, unknown>
}

type DemandDraft = {
  name: string
  valueChainStageCode: string | null
  sourceThemeId: string | null
  steps: DemandDerivationStep[]
  crossValidation: {
    conclusion: string | null
    perspectivesText: string
    evidenceSignalIds: string[]
    extra: Record<string, unknown>
  }
  timeSeries: TimeSeriesDraft[]
}

function emptyDraft(): DemandDraft {
  return {
    name: '',
    valueChainStageCode: null,
    sourceThemeId: null,
    steps: DEMAND_STEPS.map(({ key }) => ({ key, content: '', evidence_signal_ids: [] })),
    crossValidation: { conclusion: null, perspectivesText: '', evidenceSignalIds: [], extra: {} },
    timeSeries: [],
  }
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function draftFromDemand(demand: DemandOut): DemandDraft {
  const draft = emptyDraft()
  const savedSteps = new Map((demand.derivation_trace?.steps ?? []).map((step) => [step.key, step]))
  draft.name = demand.name
  draft.valueChainStageCode = demand.value_chain_stage_code
  draft.sourceThemeId = demand.source_tech_theme_id
  draft.steps = DEMAND_STEPS.map(({ key }) => {
    const saved = savedSteps.get(key)
    return {
      key,
      content: saved?.content ?? '',
      evidence_signal_ids: [...(saved?.evidence_signal_ids ?? [])],
    }
  })

  const crossValidation = demand.cross_validation ?? {}
  const { conclusion, perspectives, evidence_signal_ids, ...extra } = crossValidation
  draft.crossValidation = {
    conclusion: typeof conclusion === 'string' ? conclusion : null,
    perspectivesText: Array.isArray(perspectives)
      ? perspectives.map(asText).join('\n')
      : asText(perspectives),
    evidenceSignalIds: Array.isArray(evidence_signal_ids)
      ? evidence_signal_ids.filter((id): id is string => typeof id === 'string')
      : [],
    extra,
  }

  draft.timeSeries = (demand.time_series ?? []).map((item) => {
    if (!isRecord(item)) return { time: '', event: asText(item), extra: {} }
    const { time, event, ...otherFields } = item
    return {
      // Keep time as source text; never coerce unknown or partial dates into a calendar date.
      time: time == null ? '' : asText(time),
      event: asText(event),
      extra: otherFields,
    }
  })
  return draft
}

function buildDerivationTrace(steps: DemandDerivationStep[]) {
  return {
    steps: DEMAND_STEPS.map(({ key }) => {
      const step = steps.find((item) => item.key === key)
      return {
        key,
        content: step?.content ?? '',
        evidence_signal_ids: [...(step?.evidence_signal_ids ?? [])],
      }
    }),
  }
}

function buildCrossValidation(draft: DemandDraft): Record<string, unknown> | null {
  const perspectives = draft.crossValidation.perspectivesText
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
  if (!draft.crossValidation.conclusion && perspectives.length === 0 && draft.crossValidation.evidenceSignalIds.length === 0 && Object.keys(draft.crossValidation.extra).length === 0) {
    return null
  }
  return {
    ...draft.crossValidation.extra,
    conclusion: draft.crossValidation.conclusion,
    perspectives,
    evidence_signal_ids: [...draft.crossValidation.evidenceSignalIds],
  }
}

function buildTimeSeries(draft: DemandDraft): unknown[] {
  return draft.timeSeries.map((item) => ({
    ...item.extra,
    time: item.time.trim() ? item.time : null,
    event: item.event,
  }))
}

function eligibleEvidence(signals: SignalOut[] | undefined, themeId: string | null): SignalOut[] {
  return (signals ?? []).filter((signal) =>
    signal.tech_theme_id === themeId && signal.evidence_status_code === 'retained',
  )
}

function crossValidationEvidenceIssues(evidenceIds: string[], signals: SignalOut[]): string[] {
  const issues: string[] = []
  if (evidenceIds.length < 2) issues.push('交叉验证证据至少选择两条已留存信号')
  const uniqueIds = new Set(evidenceIds)
  const selectedSignals = [...uniqueIds]
    .map((id) => signals.find((signal) => signal.id === id))
    .filter((signal): signal is SignalOut => Boolean(signal))
  if (selectedSignals.length !== uniqueIds.size || selectedSignals.length < 2) return issues

  if (new Set(selectedSignals.map((signal) => signal.url_normalized)).size < 2) {
    issues.push('交叉验证证据必须来自至少两个不同的原始来源')
  }
  const publishers = selectedSignals
    .map((signal) => signal.publisher?.trim().toLowerCase())
    .filter((publisher): publisher is string => Boolean(publisher))
  if (new Set(publishers).size < 2) issues.push('交叉验证证据必须覆盖至少两个可区分的发布主体')
  if (new Set(selectedSignals.map((signal) => signal.channel_code)).size < 2) {
    issues.push('交叉验证证据必须覆盖不同的来源渠道')
  }

  const tagSets = selectedSignals.map((signal) => [...new Set(signal.tags ?? [])].sort().join('\u0000'))
  if (tagSets.some((tagSet) => !tagSet)) {
    issues.push('交叉验证的每条信号都必须有已确认的技术标签')
  } else if (new Set(tagSets).size < 2) {
    issues.push('交叉验证证据的技术标签组合必须存在差异')
  }
  return issues
}

function validateDraft(
  draft: DemandDraft,
  themes: ThemeDetail[] | undefined,
  themeQueryReady: boolean,
  stageCodes: string[],
  refCodesReady: boolean,
  signals: SignalOut[] | undefined,
  evidenceQueryReady: boolean,
  evidenceQueryError: boolean,
): string[] {
  const issues: string[] = []
  if (!draft.name.trim()) issues.push('请填写需求点名称')
  if (!refCodesReady) issues.push('价值链词表尚未加载，暂时无法核验价值链环节')
  else if (!draft.valueChainStageCode || !stageCodes.includes(draft.valueChainStageCode)) {
    issues.push('请选择有效的价值链环节')
  }
  if (!draft.sourceThemeId) issues.push('请选择来源主题')
  else if (!themeQueryReady) issues.push('来源主题列表尚未加载，暂时无法核验来源主题')
  else if (!themes?.some((theme) => theme.id === draft.sourceThemeId)) issues.push('所选来源主题已不存在，请重新选择')

  const signalRows = eligibleEvidence(signals, draft.sourceThemeId)
  const signalIds = new Set(signalRows.map((signal) => signal.id))
  if (draft.sourceThemeId && evidenceQueryError) issues.push('主题关联信号加载失败，无法核验证据引用，请重试')
  else if (draft.sourceThemeId && !evidenceQueryReady) issues.push('主题关联信号仍在加载，请稍后保存')

  for (const step of draft.steps) {
    const label = DEMAND_STEPS.find((item) => item.key === step.key)?.label ?? step.key
    if (!step.content.trim()) issues.push(`${label}：请填写推导内容`)
    if (step.evidence_signal_ids.length === 0) issues.push(`${label}：请至少关联一条来源主题下的信号`)
    if (new Set(step.evidence_signal_ids).size !== step.evidence_signal_ids.length) {
      issues.push(`${label}：请移除重复的信号证据`)
    }
    if (evidenceQueryReady) {
      for (const signalId of step.evidence_signal_ids) {
        if (!signalIds.has(signalId)) issues.push(`${label}：有信号不存在、未归属所选主题或当前不符合证据状态要求`)
      }
    }
  }

  if (new Set(draft.crossValidation.evidenceSignalIds).size !== draft.crossValidation.evidenceSignalIds.length) {
    issues.push('交叉验证证据：请移除重复的信号')
  }
  if (evidenceQueryReady) {
    for (const signalId of draft.crossValidation.evidenceSignalIds) {
      if (!signalIds.has(signalId)) issues.push('交叉验证证据：有信号不存在、未归属所选主题或当前不符合留存状态要求')
    }
  }

  draft.timeSeries.forEach((item, index) => {
    if (!item.event.trim()) issues.push(`时间序列第 ${index + 1} 项：请填写事件；未知时间可以留空`)
  })
  return [...new Set(issues)]
}

function statusLabel(status: string | null): string {
  if (status === 'confirmed') return '已确认'
  if (status === 'pending') return '待复核'
  return status || '—'
}

function errorMessage(error: unknown): string {
  return error instanceof EeaApiError ? error.message : String(error)
}

function draftFromProposal(proposal: DemandDraftProposal): DemandDraft {
  const base = emptyDraft()
  const savedSteps = new Map((proposal.derivation_trace?.steps ?? []).map((step) => [step.key, step]))
  base.name = proposal.name
  base.valueChainStageCode = proposal.value_chain_stage_code
  base.sourceThemeId = proposal.source_tech_theme_id
  base.steps = DEMAND_STEPS.map(({ key }) => {
    const saved = savedSteps.get(key)
    return {
      key,
      content: saved?.content ?? '',
      evidence_signal_ids: [...(saved?.evidence_signal_ids ?? [])],
    }
  })
  const crossValidation = proposal.cross_validation ?? {}
  const { conclusion, perspectives, evidence_signal_ids, ...extra } = crossValidation as Record<string, unknown>
  base.crossValidation = {
    conclusion: typeof conclusion === 'string' ? conclusion : null,
    perspectivesText: Array.isArray(perspectives)
      ? perspectives.map(asText).join('\n')
      : asText(perspectives),
    evidenceSignalIds: Array.isArray(evidence_signal_ids)
      ? evidence_signal_ids.filter((id): id is string => typeof id === 'string')
      : [],
    extra: isRecord(extra) ? extra : {},
  }
  base.timeSeries = []
  return base
}

function confirmationErrorMessage(error: unknown): string {
  if (error instanceof EeaApiError && error.status === 403) {
    return `服务端拒绝确认：确认权限仅限 taxonomy_admin 或 platform_admin。${error.message ? `（${error.message}）` : ''}`
  }
  return errorMessage(error)
}

type DemandPointWorkbenchProps = {
  /** When false, render without outer Card (for Drawer shell). */
  showCard?: boolean
  onDirtyChange?: (dirty: boolean) => void
}

export function DemandPointWorkbench({ showCard = true, onDirtyChange }: DemandPointWorkbenchProps) {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const refCodesQuery = useRefCodeMaps()
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<DemandDraft>(emptyDraft)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState<'save' | 'confirm' | null>(null)
  const [validationIssues, setValidationIssues] = useState<string[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [assistantSignalIds, setAssistantSignalIds] = useState<string[]>([])

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  const demandsQuery = useQuery({ queryKey: eeaQueryKeys.demands, queryFn: fetchDemands })
  const themesQuery = useQuery({ queryKey: eeaQueryKeys.themes, queryFn: fetchThemes })
  const evidenceQuery = useQuery({
    queryKey: eeaQueryKeys.signals(draft.sourceThemeId ? { theme_id: draft.sourceThemeId, limit: 200 } : { theme_id: null, limit: 200 }),
    queryFn: () => draft.sourceThemeId
      ? fetchSignals({ theme_id: draft.sourceThemeId, limit: 200 })
      : Promise.resolve([]),
    enabled: Boolean(draft.sourceThemeId),
  })

  const demands = demandsQuery.data ?? []
  const themes = themesQuery.data ?? []
  const selectedDemand = demands.find((demand) => demand.id === selectedDemandId)
  const stageOptions = Object.entries(refCodesQuery.maps.byDomain.value_chain_stage ?? {})
    .map(([value, label]) => ({ value, label }))
  const stageCodes = stageOptions.map((option) => option.value)
  const evidenceSignals = useMemo(
    () => eligibleEvidence(evidenceQuery.data, draft.sourceThemeId),
    [evidenceQuery.data, draft.sourceThemeId],
  )

  const evidenceSignalIdsKey = useMemo(
    () => evidenceSignals.map((signal) => signal.id).join('\u0000'),
    [evidenceSignals],
  )

  useEffect(() => {
    if (!creating || !draft.sourceThemeId) {
      setAssistantSignalIds((current) => (current.length === 0 ? current : []))
      return
    }
    const ids = evidenceSignalIdsKey ? evidenceSignalIdsKey.split('\u0000') : []
    setAssistantSignalIds((current) => {
      if (!ids.length) return current.length === 0 ? current : []
      if (!current.length) return ids
      const kept = current.filter((id) => ids.includes(id))
      const next = kept.length ? kept : ids
      if (next.length === current.length && next.every((id, index) => id === current[index])) {
        return current
      }
      return next
    })
  }, [creating, draft.sourceThemeId, evidenceSignalIdsKey])

  const evidenceOptions = evidenceSignals.map((signal) => ({
    value: signal.id,
    label: `${signal.title} · ${signal.publisher ?? signal.source_label ?? signal.url}`,
  }))
  const crossValidationEvidenceInvalidCount = draft.crossValidation.evidenceSignalIds
    .filter((id) => !evidenceSignals.some((signal) => signal.id === id)).length
  const baseValidationIssues = validateDraft(
    draft,
    themesQuery.data,
    themesQuery.isSuccess,
    stageCodes,
    refCodesQuery.isSuccess,
    evidenceQuery.data,
    evidenceQuery.isSuccess,
    evidenceQuery.isError,
  )
  const confirmationIssues = [
    ...baseValidationIssues,
    ...crossValidationEvidenceIssues(draft.crossValidation.evidenceSignalIds, evidenceSignals),
    ...(draft.crossValidation.conclusion === '通过' ? [] : ['交叉验证结论须为“通过”']),
    ...(draft.crossValidation.perspectivesText.split('\n').filter((item) => item.trim()).length >= 2 ? [] : ['请至少填写两个交叉验证视角']),
    ...(dirty ? ['请先保存当前修改，再单独确认需求'] : []),
  ]

  const clearFeedback = () => {
    setValidationIssues([])
    setServerError(null)
  }

  const updateDraft = (update: (current: DemandDraft) => DemandDraft) => {
    setDraft(update)
    setDirty(true)
    clearFeedback()
  }

  const startCreate = () => {
    if (dirty || busy) return
    setSelectedDemandId(null)
    setDraft(emptyDraft())
    setCreating(true)
    setEditing(true)
    setDirty(false)
    clearFeedback()
  }

  const editDemand = (demand: DemandOut) => {
    if (dirty || busy) return
    setSelectedDemandId(demand.id)
    setDraft(draftFromDemand(demand))
    setCreating(false)
    setEditing(true)
    setDirty(false)
    clearFeedback()
  }

  const discardChanges = () => {
    setEditing(false)
    setCreating(false)
    setSelectedDemandId(null)
    setDraft(emptyDraft())
    setDirty(false)
    clearFeedback()
  }

  const rememberSavedDemand = async (saved: DemandOut, submitted: DemandCreatePayload | DemandUpdatePayload) => {
    const merged: DemandOut = {
      ...saved,
      derivation_trace: saved.derivation_trace === undefined
        ? (submitted.derivation_trace as DemandOut['derivation_trace']) ?? null
        : saved.derivation_trace,
      cross_validation: saved.cross_validation === undefined
        ? (submitted.cross_validation as DemandOut['cross_validation']) ?? null
        : saved.cross_validation,
      time_series: saved.time_series === undefined
        ? (submitted.time_series as DemandOut['time_series']) ?? null
        : saved.time_series,
    }
    queryClient.setQueryData<DemandOut[]>(eeaQueryKeys.demands, (current) => {
      if (!current) return [merged]
      const exists = current.some((demand) => demand.id === merged.id)
      return exists
        ? current.map((demand) => demand.id === merged.id ? merged : demand)
        : [...current, merged]
    })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.demands })
    setSelectedDemandId(merged.id)
    setDraft(draftFromDemand(merged))
    setCreating(false)
    setEditing(true)
    setDirty(false)
    clearFeedback()
    messageApi.success(merged.review_status === 'confirmed' ? '需求点已确认' : '需求点已保存为待复核')
  }

  const validateWithFreshEvidence = async (requireCrossValidationEvidence = false) => {
    let latestSignals = evidenceQuery.data
    let queryReady = evidenceQuery.isSuccess
    let queryError = evidenceQuery.isError
    if (draft.sourceThemeId) {
      const result = await evidenceQuery.refetch()
      latestSignals = result.data
      queryReady = result.isSuccess
      queryError = result.isError
    }
    const issues = validateDraft(
      draft,
      themesQuery.data,
      themesQuery.isSuccess,
      stageCodes,
      refCodesQuery.isSuccess,
      latestSignals,
      queryReady,
      queryError,
    )
    if (requireCrossValidationEvidence) {
      issues.push(...crossValidationEvidenceIssues(
        draft.crossValidation.evidenceSignalIds,
        eligibleEvidence(latestSignals, draft.sourceThemeId),
      ))
    }
    setValidationIssues(issues)
    return issues
  }

  const saveDemand = async () => {
    clearFeedback()
    setBusy('save')
    try {
      const issues = await validateWithFreshEvidence()
      if (issues.length) return

      const payload: DemandCreatePayload = {
        name: draft.name.trim(),
        source_tech_theme_id: draft.sourceThemeId!,
        value_chain_stage_code: draft.valueChainStageCode!,
        derivation_trace: buildDerivationTrace(draft.steps),
        cross_validation: buildCrossValidation(draft),
        time_series: buildTimeSeries(draft),
        review_status: 'pending',
      }
      if (creating) {
        const saved = await createDemand(payload)
        await rememberSavedDemand(saved, payload)
      } else if (selectedDemandId) {
        const updatePayload: DemandUpdatePayload = {
          name: payload.name,
          source_tech_theme_id: payload.source_tech_theme_id,
          value_chain_stage_code: payload.value_chain_stage_code,
          derivation_trace: payload.derivation_trace,
          cross_validation: payload.cross_validation,
          time_series: payload.time_series,
        }
        const saved = await patchDemand(selectedDemandId, updatePayload)
        await rememberSavedDemand(saved, updatePayload)
      } else {
        setValidationIssues(['请选择要编辑的需求点，或新建需求点。'])
      }
    } catch (error) {
      setServerError(errorMessage(error))
    } finally {
      setBusy(null)
    }
  }

  const confirmDemand = async () => {
    clearFeedback()
    if (!selectedDemandId || !selectedDemand || creating) {
      setValidationIssues(['请先保存需求点，再单独执行确认。'])
      return
    }
    if (selectedDemand.review_status === 'confirmed') {
      setValidationIssues(['该需求点已由服务端标记为已确认。'])
      return
    }
    setBusy('confirm')
    try {
      const issues = await validateWithFreshEvidence(true)
      const perspectives = draft.crossValidation.perspectivesText.split('\n').map((item) => item.trim()).filter(Boolean)
      if (draft.crossValidation.conclusion !== '通过') issues.push('交叉验证结论须为“通过”')
      if (perspectives.length < 2) issues.push('请至少填写两个交叉验证视角')
      if (dirty) issues.push('请先保存当前修改，再单独确认需求')
      if (issues.length) {
        setValidationIssues([...new Set(issues)])
        return
      }

      // Confirmation is intentionally its own PATCH. Server checks the saved cross-validation.
      const saved = await patchDemand(selectedDemandId, { review_status: 'confirmed' })
      await rememberSavedDemand(saved, { review_status: 'confirmed' })
    } catch (error) {
      setServerError(confirmationErrorMessage(error))
    } finally {
      setBusy(null)
    }
  }

  const updateStep = (stepKey: DemandDerivationStepKey, update: (step: DemandDerivationStep) => DemandDerivationStep) => {
    updateDraft((current) => ({
      ...current,
      steps: current.steps.map((step) => step.key === stepKey ? update(step) : step),
    }))
  }

  const railColumns = [
    {
      title: '需求点',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '复核',
      width: 72,
      dataIndex: 'review_status',
      render: (status: string | null) => (
        <Tag color={status === 'confirmed' ? 'success' : status === 'pending' ? 'warning' : 'default'}>
          {statusLabel(status)}
        </Tag>
      ),
    },
  ]

  const createButton = (
    <Button type="primary" onClick={startCreate} disabled={dirty || Boolean(busy)}>
      新建需求点
    </Button>
  )

  const shell = (
      <div className={`demand-workbench-layout${editing ? ' demand-workbench-layout--detail-open' : ''}`}>
        <aside className="demand-workbench-rail" aria-label="已保存需求点">
          {demandsQuery.isError ? (
            <Alert
              type="error"
              showIcon
              title="加载失败"
              description={errorMessage(demandsQuery.error)}
              action={<Button size="small" onClick={() => void demandsQuery.refetch()}>重试</Button>}
            />
          ) : (
            <Table<DemandOut>
              className="demand-workbench-list"
              size="small"
              rowKey="id"
              loading={demandsQuery.isLoading}
              dataSource={demands}
              pagination={{ pageSize: 10, size: 'small', hideOnSinglePage: true }}
              locale={{
                emptyText: <PlatformEmptyState title="暂无需求点" description="新建后保存在此列表。" />,
              }}
              columns={railColumns}
              rowClassName={(record) => {
                if (editing && !creating && record.id === selectedDemandId) return 'demand-workbench-row-selected'
                return ''
              }}
              onRow={(record) => ({
                onClick: () => {
                  if (dirty || busy) return
                  editDemand(record)
                },
              })}
            />
          )}
        </aside>

        <main className={`demand-workbench-main${editing ? ' demand-workbench-main--active' : ''}`}>
        {editing ? (
          <section className="demand-edit-panel" aria-label={creating ? '新建需求点' : '编辑需求点'}>
            {!creating ? (
              <header className="demand-detail-panel-head">
                <Text strong className="demand-detail-panel-title">{draft.name.trim() || '未命名需求点'}</Text>
                {selectedDemand ? (
                  <Tag color={selectedDemand.review_status === 'confirmed' ? 'success' : 'warning'}>
                    {statusLabel(selectedDemand.review_status)}
                  </Tag>
                ) : null}
              </header>
            ) : null}
            <Space orientation="vertical" size={12} style={{ width: '100%' }}>
              {dirty ? (
                <Alert type="info" showIcon title="有未保存修改" style={{ marginBottom: 0 }} />
              ) : null}

              {creating ? (
                <div className="demand-draft-workspace demand-draft-workspace--unified">
                  <div className="demand-draft-workspace-toolbar">
                    <Text strong className="demand-draft-toolbar-label">来源主题</Text>
                    {themesQuery.isError ? (
                      <Alert
                        type="error"
                        showIcon
                        title="主题列表加载失败"
                        description={errorMessage(themesQuery.error)}
                        action={<Button size="small" onClick={() => void themesQuery.refetch()}>重试</Button>}
                      />
                    ) : (
                      <Select
                        allowClear
                        showSearch={{ optionFilterProp: 'label' }}
                        loading={themesQuery.isLoading}
                        disabled={!themesQuery.isSuccess || Boolean(busy)}
                        value={draft.sourceThemeId ?? undefined}
                        onChange={(value) => updateDraft((current) => ({ ...current, sourceThemeId: value ?? null }))}
                        options={themes.map((theme) => ({ value: theme.id, label: theme.working_name }))}
                        placeholder="选择需求来源主题"
                        className="demand-create-theme-select"
                      />
                    )}
                  </div>
                  {themesQuery.isSuccess && themes.length === 0 ? (
                    <Text type="secondary" className="demand-draft-empty-themes">
                      暂无服务端主题；先创建主题并归集信号后再建立需求点。
                    </Text>
                  ) : null}
                  <aside className="demand-draft-source-column">
                    <DemandSignalLibrary
                      compact
                      signals={evidenceSignals}
                      selectedIds={assistantSignalIds}
                      loading={Boolean(draft.sourceThemeId) && evidenceQuery.isLoading}
                      onChangeSelected={setAssistantSignalIds}
                    />
                  </aside>
                  <div className="demand-draft-chat-column">
                    <DemandDraftAssistant
                      compact
                      themeId={draft.sourceThemeId}
                      selectedSignalIds={assistantSignalIds}
                      onApplyDraft={(proposal) => {
                        setDraft(draftFromProposal(proposal))
                        setDirty(true)
                        clearFeedback()
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Text strong>来源主题</Text>
                  {themesQuery.isError ? (
                    <Alert
                      type="error"
                      showIcon
                      title="主题列表加载失败"
                      description={errorMessage(themesQuery.error)}
                      action={<Button size="small" onClick={() => void themesQuery.refetch()}>重试</Button>}
                      style={{ marginTop: 5 }}
                    />
                  ) : null}
                  {themesQuery.isSuccess && themes.length === 0 ? (
                    <Text type="secondary" style={{ display: 'block' }}>暂无服务端主题；先创建主题并归集信号后再建立需求点。</Text>
                  ) : null}
                  <Select
                    allowClear
                    showSearch={{ optionFilterProp: 'label' }}
                    loading={themesQuery.isLoading}
                    disabled={!themesQuery.isSuccess || Boolean(busy) || !dirty}
                    value={draft.sourceThemeId ?? undefined}
                    onChange={(value) => updateDraft((current) => ({ ...current, sourceThemeId: value ?? null }))}
                    options={themes.map((theme) => ({ value: theme.id, label: theme.working_name }))}
                    placeholder="选择需求来源主题"
                    style={{ width: '100%', marginTop: 5 }}
                  />
                </div>
              )}

              <Collapse
                bordered={false}
                defaultActiveKey={creating ? [] : ['manual']}
                items={[{
                  key: 'manual',
                  label: creating ? '手动微调（可选）' : '需求点字段与推导记录',
                  children: (
                    <Space orientation="vertical" size={14} style={{ width: '100%' }}>
              <div>
                <Text strong>需求点名称</Text>
                <Input
                  value={draft.name}
                  disabled={Boolean(busy)}
                  onChange={(event) => updateDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="根据五步推导抽象并命名需求点"
                  style={{ marginTop: 5 }}
                />
              </div>

              <div>
                <Text strong>价值链环节</Text>
                {refCodesQuery.isError ? (
                  <Alert
                    type="error"
                    showIcon
                    title="价值链词表加载失败"
                    description={errorMessage(refCodesQuery.error)}
                    action={<Button size="small" onClick={() => void refCodesQuery.refetch()}>重试</Button>}
                    style={{ marginTop: 5 }}
                  />
                ) : null}
                {refCodesQuery.isSuccess && stageOptions.length === 0 ? <Text type="secondary" style={{ display: 'block' }}>价值链词表暂无可选项。</Text> : null}
                <Select
                  allowClear
                  loading={refCodesQuery.isLoading}
                  disabled={!refCodesQuery.isSuccess || Boolean(busy)}
                  value={draft.valueChainStageCode ?? undefined}
                  onChange={(value) => updateDraft((current) => ({ ...current, valueChainStageCode: value ?? null }))}
                  options={stageOptions}
                  placeholder="从服务端价值链词表中选择"
                  style={{ width: '100%', marginTop: 5 }}
                />
              </div>

              <Card size="small" title="五步需求推导">
                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                  {DEMAND_STEPS.map(({ key, label }, index) => {
                    const step = draft.steps.find((item) => item.key === key) ?? { key, content: '', evidence_signal_ids: [] }
                    return (
                      <div key={key}>
                        <Text strong>{index + 1}. {label}</Text>
                        <TextArea
                          value={step.content}
                          disabled={Boolean(busy)}
                          autoSize={{ minRows: 2, maxRows: 5 }}
                          onChange={(event) => updateStep(key, (current) => ({ ...current, content: event.target.value }))}
                          placeholder={`填写${label}过程与依据`}
                          style={{ marginTop: 5 }}
                        />
                        <Select
                          mode="multiple"
                          allowClear
                          showSearch={{ optionFilterProp: 'label' }}
                          loading={Boolean(draft.sourceThemeId) && evidenceQuery.isLoading}
                          disabled={!draft.sourceThemeId || !evidenceQuery.isSuccess || Boolean(busy)}
                          value={step.evidence_signal_ids}
                          onChange={(values) => updateStep(key, (current) => ({ ...current, evidence_signal_ids: values }))}
                          options={evidenceOptions}
                          placeholder={draft.sourceThemeId ? '选择该主题下已留存的信号证据' : '先选择来源主题'}
                          style={{ width: '100%', marginTop: 5 }}
                        />
                        {step.evidence_signal_ids.length > 0 && evidenceQuery.isSuccess ? (
                          <Text type="secondary" style={{ display: 'block', marginTop: 3 }}>
                            {step.evidence_signal_ids.filter((id) => !evidenceSignals.some((signal) => signal.id === id)).length
                              ? '部分已保存证据不属于当前主题或已不符合证据状态要求，请重新选择。'
                              : `已关联 ${step.evidence_signal_ids.length} 条有效信号`}
                          </Text>
                        ) : null}
                      </div>
                    )
                  })}
                  {draft.sourceThemeId && evidenceQuery.isError ? (
                    <Alert
                      type="error"
                      showIcon
                      title="主题关联信号加载失败"
                      description={errorMessage(evidenceQuery.error)}
                      action={<Button size="small" onClick={() => void evidenceQuery.refetch()}>重试</Button>}
                    />
                  ) : null}
                  {draft.sourceThemeId && evidenceQuery.isSuccess && evidenceSignals.length === 0 ? (
                    <PlatformEmptyState title="该主题暂无可用信号" description="请选择该主题下已留存的信号；其他状态的信号不能作为需求推导证据。" />
                  ) : null}
                </Space>
              </Card>

              <Card size="small" title="交叉验证">
                <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                  <div>
                    <Text strong>交叉验证证据（至少两条）</Text>
                    <Select
                      mode="multiple"
                      allowClear
                      showSearch={{ optionFilterProp: 'label' }}
                      loading={Boolean(draft.sourceThemeId) && evidenceQuery.isLoading}
                      disabled={!draft.sourceThemeId || !evidenceQuery.isSuccess || Boolean(busy)}
                      value={draft.crossValidation.evidenceSignalIds}
                      onChange={(values) => updateDraft((current) => ({
                        ...current,
                        crossValidation: { ...current.crossValidation, evidenceSignalIds: values },
                      }))}
                      options={evidenceOptions}
                      placeholder={draft.sourceThemeId ? '选择该主题下已留存的来源信号' : '先选择来源主题'}
                      style={{ width: '100%', marginTop: 5 }}
                    />
                    <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                      确认时服务端还会核验信号来源主体/渠道及技术标签差异；仅选择数量充足不代表验证通过。
                    </Text>
                    {crossValidationEvidenceInvalidCount > 0 && evidenceQuery.isSuccess ? (
                      <Text type="danger" style={{ display: 'block', marginTop: 4 }}>
                        有 {crossValidationEvidenceInvalidCount} 条已保存证据不属于当前主题或已不再留存，请重新选择。
                      </Text>
                    ) : null}
                    {draft.crossValidation.evidenceSignalIds.length > 0 && crossValidationEvidenceInvalidCount === 0 && evidenceQuery.isSuccess ? (
                      <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                        已关联 {draft.crossValidation.evidenceSignalIds.length} 条留存信号。
                      </Text>
                    ) : null}
                  </div>
                  <div>
                    <Text strong>验证结论</Text>
                    <Select
                      allowClear
                      disabled={Boolean(busy)}
                      value={draft.crossValidation.conclusion ?? undefined}
                      onChange={(value) => updateDraft((current) => ({
                        ...current,
                        crossValidation: { ...current.crossValidation, conclusion: value ?? null },
                      }))}
                      options={[
                        { value: '通过', label: '通过' },
                        { value: '不通过', label: '不通过' },
                      ]}
                      placeholder="选择交叉验证结论"
                      style={{ width: '100%', marginTop: 5 }}
                    />
                  </div>
                  <div>
                    <Text strong>验证视角</Text>
                    <TextArea
                      value={draft.crossValidation.perspectivesText}
                      disabled={Boolean(busy)}
                      autoSize={{ minRows: 3, maxRows: 6 }}
                      onChange={(event) => updateDraft((current) => ({
                        ...current,
                        crossValidation: { ...current.crossValidation, perspectivesText: event.target.value },
                      }))}
                      placeholder="至少填写两个实际参与交叉验证的视角，每行一个；不预设视角选项"
                      style={{ marginTop: 5 }}
                    />
                  </div>
                </Space>
              </Card>

              <Card size="small" title="时间序列">
                <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                  <Text type="secondary">时间按原始记录文本保存；未知或模糊日期可原样填写，未获知时留空，不自动补日期。</Text>
                  {draft.timeSeries.map((item, index) => (
                    <Card key={`time-series-${index}`} size="small">
                      <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                        <Input
                          value={item.time}
                          disabled={Boolean(busy)}
                          onChange={(event) => updateDraft((current) => ({
                            ...current,
                            timeSeries: current.timeSeries.map((row, rowIndex) => rowIndex === index ? { ...row, time: event.target.value } : row),
                          }))}
                          placeholder="事件时间；未知可留空"
                        />
                        <TextArea
                          value={item.event}
                          disabled={Boolean(busy)}
                          autoSize={{ minRows: 2, maxRows: 4 }}
                          onChange={(event) => updateDraft((current) => ({
                            ...current,
                            timeSeries: current.timeSeries.map((row, rowIndex) => rowIndex === index ? { ...row, event: event.target.value } : row),
                          }))}
                          placeholder="记录发生的事件"
                        />
                        <Button
                          danger
                          size="small"
                          disabled={Boolean(busy)}
                          onClick={() => updateDraft((current) => ({
                            ...current,
                            timeSeries: current.timeSeries.filter((_, rowIndex) => rowIndex !== index),
                          }))}
                        >
                          删除时间序列项
                        </Button>
                      </Space>
                    </Card>
                  ))}
                  <Button
                    disabled={Boolean(busy)}
                    onClick={() => updateDraft((current) => ({
                      ...current,
                      timeSeries: [...current.timeSeries, { time: '', event: '', extra: {} }],
                    }))}
                  >
                    添加时间序列项
                  </Button>
                </Space>
              </Card>

              {validationIssues.length > 0 ? (
                <Alert
                  type="error"
                  showIcon
                  title="请先修正以下内容"
                  description={validationIssues.map((issue) => <div key={issue}>{issue}</div>)}
                />
              ) : null}
              {serverError ? <Alert type="error" showIcon title="服务端未接受本次操作" description={serverError} /> : null}

              {!creating && selectedDemand?.review_status === 'confirmed' ? (
                <Alert type="warning" showIcon title="保存已确认需求的修改后，服务端会将状态退回待复核。" />
              ) : null}
              {creating ? <Text type="secondary">保存时会创建为待复核。交叉验证通过且五步证据校验完成后，可再单独提交确认 PATCH。</Text> : null}
              {!creating && selectedDemand?.review_status !== 'confirmed' && confirmationIssues.length > 0 ? (
                <Alert
                  type="info"
                  showIcon
                  title="单独确认前还需满足"
                  description={confirmationIssues.map((issue) => <div key={issue}>{issue}</div>)}
                />
              ) : null}

              <Space wrap>
                <Button
                  type="primary"
                  loading={busy === 'save'}
                  disabled={Boolean(busy) || (!creating && !dirty)}
                  onClick={() => void saveDemand()}
                >
                  {creating ? '创建为待复核' : '保存修改'}
                </Button>
                {!creating && selectedDemand?.review_status !== 'confirmed' ? (
                  <Button
                    loading={busy === 'confirm'}
                    disabled={Boolean(busy) || dirty || confirmationIssues.length > 0}
                    onClick={() => void confirmDemand()}
                  >
                    单独确认需求
                  </Button>
                ) : null}
                <Button disabled={Boolean(busy)} onClick={discardChanges}>
                  {dirty ? '放弃未保存修改' : '关闭'}
                </Button>
              </Space>
                    </Space>
                  ),
                }]}
              />
            </Space>
          </section>
        ) : (
          <div className="demand-workbench-idle">
            <Text type="secondary">在左侧选择需求点，或点击「新建需求点」。</Text>
          </div>
        )}
        </main>
      </div>
  )

  if (!showCard) {
    return (
      <div className="demand-workbench-embedded">
        <div className="demand-workbench-embedded-toolbar">{createButton}</div>
        {shell}
      </div>
    )
  }

  return (
    <Card
      className="panel-card view-card demand-point-workbench-card"
      title="需求点工作台"
      extra={createButton}
    >
      {shell}
    </Card>
  )
}
