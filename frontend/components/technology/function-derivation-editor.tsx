'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { App as AntApp, Alert, Button, Card, Checkbox, Input, Select, Space, Spin, Tag, Typography } from 'antd'
import { EeaApiError } from '@/lib/api/client'
import {
  createVehicleFunction,
  fetchDemands,
  fetchVehicleFunctions,
  fetchVocab,
  patchVehicleFunction,
} from '@/lib/api/eea-api'
import type {
  DemandOut,
  VehicleFunctionCreatePayload,
  VehicleFunctionOut,
  VehicleFunctionUpdatePayload,
  VocabOut,
} from '@/lib/api/types'
import { eeaQueryKeys } from '@/hooks/use-eea-queries'
import { PlatformEmptyState } from '@/components/shared/empty-state'

const { Text } = Typography
const { TextArea } = Input

const FORWARD_STEPS = [
  { key: 'core_needs', label: '核心诉求' },
  { key: 'capability_gaps', label: '能力缺口' },
  { key: 'vehicle_flow', label: '车端关键流' },
  { key: 'system_behavior', label: '系统行为' },
  { key: 'function', label: '车辆功能' },
] as const

const AUTOMATION_LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']
const functionQueryKey = eeaQueryKeys.vehicleFunctions

type ForwardStepKey = (typeof FORWARD_STEPS)[number]['key']
type CoverageDraft = { need: string; coverage: string }

type FunctionDraft = {
  name: string
  forward: Record<ForwardStepKey, string>
  necessity: string
  coverage: CoverageDraft[]
  fullCoverage: boolean
  unresolvedContradictions: string
  conclusion: string | null
  humanConfirmed: boolean
  recommendationLevel: string | null
  automationLevels: string[]
  targetDomain: string | null
  recommendationReason: string
  l2L4Difference: string
}

function emptyDraft(): FunctionDraft {
  return {
    name: '',
    forward: {
      core_needs: '',
      capability_gaps: '',
      vehicle_flow: '',
      system_behavior: '',
      function: '',
    },
    necessity: '',
    coverage: [],
    fullCoverage: false,
    unresolvedContradictions: '',
    conclusion: null,
    humanConfirmed: false,
    recommendationLevel: null,
    automationLevels: [],
    targetDomain: null,
    recommendationReason: '',
    l2L4Difference: '',
  }
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function draftFromFunction(vehicleFunction: VehicleFunctionOut): FunctionDraft {
  const draft = emptyDraft()
  const forwardTrace = vehicleFunction.forward_trace ?? {}
  const legacySteps = Array.isArray(forwardTrace.steps) ? forwardTrace.steps : []
  for (const [index, step] of FORWARD_STEPS.entries()) {
    draft.forward[step.key] = asText(forwardTrace[step.key] ?? legacySteps[index])
  }

  const reverseTrace = vehicleFunction.reverse_trace ?? {}
  const rawCoverage = Array.isArray(reverseTrace.coverage) ? reverseTrace.coverage : []
  draft.name = vehicleFunction.name
  draft.necessity = asText(reverseTrace.necessity)
  draft.coverage = rawCoverage.map((item) => {
    if (typeof item === 'string') return { need: item, coverage: '' }
    if (isRecord(item)) {
      return { need: asText(item.need), coverage: asText(item.coverage) }
    }
    return { need: asText(item), coverage: '' }
  })
  draft.fullCoverage = reverseTrace.full_coverage === true
  draft.unresolvedContradictions = Array.isArray(reverseTrace.unresolved_contradictions)
    ? reverseTrace.unresolved_contradictions.map(asText).join('\n')
    : asText(reverseTrace.unresolved_contradictions)
  draft.conclusion = typeof reverseTrace.conclusion === 'string' ? reverseTrace.conclusion : null
  draft.humanConfirmed = reverseTrace.human_confirmed === true
  draft.recommendationLevel = vehicleFunction.recommendation_level
  draft.automationLevels = vehicleFunction.automation_levels ?? []
  draft.targetDomain = vehicleFunction.target_domain
  draft.recommendationReason = vehicleFunction.recommendation_reason ?? ''
  draft.l2L4Difference = vehicleFunction.l2_l4_difference ?? ''
  return draft
}

function buildForwardTrace(draft: FunctionDraft): Record<string, unknown> {
  return { steps: FORWARD_STEPS.map((step) => draft.forward[step.key]) }
}

function buildReverseTrace(draft: FunctionDraft): Record<string, unknown> {
  return {
    necessity: draft.necessity,
    coverage: draft.coverage.map(({ need, coverage }) => ({ need, coverage })),
    full_coverage: draft.fullCoverage,
    unresolved_contradictions: draft.unresolvedContradictions
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    conclusion: draft.conclusion,
    human_confirmed: draft.humanConfirmed,
  }
}

function missingForwardSteps(draft: FunctionDraft): string[] {
  return FORWARD_STEPS
    .filter((step) => !draft.forward[step.key].trim())
    .map((step) => step.label)
}

function coreNeedItems(value: string): string[] {
  const items: string[] = []
  for (const raw of value.split(/\r?\n/)) {
    let item = raw.trim()
    if (!item) continue
    if (items.length === 0 && item.includes('：')) {
      const [label, ...tail] = item.split('：')
      if (label.includes('诉求')) {
        item = tail.join('：').trim()
        if (!item) continue
      }
    }
    item = item.replace(/^\s*(?:[-*•‧]|\d+[.)、])\s*/, '').trim()
    if (item) items.push(item)
  }
  return items
}

function normalizeNeed(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase()
}

function syncCoverageToCoreNeeds(draft: FunctionDraft): FunctionDraft {
  const existing = new Map(
    draft.coverage.map((item) => [normalizeNeed(item.need), item.coverage]),
  )
  return {
    ...draft,
    coverage: coreNeedItems(draft.forward.core_needs).map((need) => ({
      need,
      coverage: existing.get(normalizeNeed(need)) ?? '',
    })),
  }
}

function demandReadinessIssues(demand: DemandOut): string[] {
  const issues: string[] = []
  const crossValidation = demand.cross_validation
  const perspectives = crossValidation?.perspectives
  if (crossValidation?.conclusion !== '通过') issues.push('需求交叉验证结论须为“通过”')
  if (!Array.isArray(perspectives) || perspectives.length === 0 || !perspectives.every((item) => typeof item === 'string' && item.trim())) {
    issues.push('需求须保存有效的交叉验证视角')
  }
  if (demand.review_status !== 'confirmed') issues.push('需求须由服务端确认后才能进入功能推导或发布')
  return issues
}

function validateDraft(draft: FunctionDraft, demand: DemandOut | undefined, publishing: boolean): string[] {
  const issues: string[] = []
  if (!draft.name.trim()) issues.push('请填写车辆功能名称')
  const missing = missingForwardSteps(draft)
  if (missing.length) issues.push(`正向推导缺少：${missing.join('、')}`)

  if (publishing) {
    if (!demand) issues.push('请选择有效需求点')
    else issues.push(...demandReadinessIssues(demand))
    if (!draft.necessity.trim()) issues.push('请说明该车辆功能的必要性')
    if (draft.coverage.length === 0) issues.push('请逐项填写需求覆盖')
    else if (draft.coverage.some((item) => !item.need.trim() || !item.coverage.trim())) {
      issues.push('每项需求都须填写需求内容和对应覆盖说明')
    }
    const expectedNeeds = coreNeedItems(draft.forward.core_needs).map(normalizeNeed)
    const coverageNeeds = draft.coverage.map((item) => normalizeNeed(item.need))
    if (
      expectedNeeds.length === 0
      || coverageNeeds.length !== expectedNeeds.length
      || new Set(coverageNeeds).size !== coverageNeeds.length
      || expectedNeeds.some((need) => !coverageNeeds.includes(need))
    ) {
      issues.push('反向验证须与正向推导中的核心诉求逐项对应，不能遗漏、重复或新增')
    }
    if (!draft.fullCoverage) issues.push('请确认覆盖全部核心诉求')
    if (draft.unresolvedContradictions.split('\n').some((item) => item.trim())) {
      issues.push('仍有未解决矛盾，不能发布')
    }
    if (draft.conclusion !== 'consistent') issues.push('正反向结论须明确为一致')
    if (!draft.humanConfirmed) issues.push('请完成人工一致性确认')
    if (!draft.recommendationLevel) issues.push('请选择推荐等级')
    if (!draft.automationLevels.length) issues.push('请选择至少一个自动化等级')
    if (!draft.targetDomain) issues.push('请选择目标域')
    if (!draft.recommendationReason.trim()) issues.push('请填写推荐原因')
    if (!draft.l2L4Difference.trim()) issues.push('请填写 L2 与 L4 功能差异')
  }
  return [...new Set(issues)]
}

function toCreatePayload(demandId: string, draft: FunctionDraft): VehicleFunctionCreatePayload {
  return {
    demand_point_id: demandId,
    name: draft.name.trim(),
    forward_trace: buildForwardTrace(draft),
    reverse_trace: buildReverseTrace(draft),
    recommendation_level: draft.recommendationLevel,
    automation_levels: draft.automationLevels,
    target_domain: draft.targetDomain,
    recommendation_reason: draft.recommendationReason,
    l2_l4_difference: draft.l2L4Difference,
  }
}

function toUpdatePayload(draft: FunctionDraft, published: boolean): VehicleFunctionUpdatePayload {
  return {
    name: draft.name.trim(),
    forward_trace: buildForwardTrace(draft),
    reverse_trace: buildReverseTrace(draft),
    recommendation_level: draft.recommendationLevel,
    automation_levels: draft.automationLevels,
    target_domain: draft.targetDomain,
    recommendation_reason: draft.recommendationReason,
    l2_l4_difference: draft.l2L4Difference,
    published,
  }
}

function optionRows(entries: VocabOut[] | undefined) {
  return (entries ?? []).map((entry) => ({ value: entry.name, label: entry.name }))
}

function formatError(error: unknown): string {
  return error instanceof EeaApiError ? error.message : String(error)
}

export function FunctionDerivationEditor() {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const [demandId, setDemandId] = useState<string | null>(null)
  const [functionId, setFunctionId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [draft, setDraft] = useState<FunctionDraft>(emptyDraft)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState<'save' | 'publish' | null>(null)
  const [validationIssues, setValidationIssues] = useState<string[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const demandsQuery = useQuery({ queryKey: eeaQueryKeys.demands, queryFn: fetchDemands })
  const functionsQuery = useQuery({
    queryKey: functionQueryKey(demandId),
    queryFn: () => fetchVehicleFunctions(demandId ?? undefined),
    enabled: Boolean(demandId),
  })
  const recommendationQuery = useQuery({
    queryKey: eeaQueryKeys.vocab('recommendation_level'),
    queryFn: () => fetchVocab('recommendation_level'),
  })
  const targetDomainQuery = useQuery({
    queryKey: eeaQueryKeys.vocab('target_domain'),
    queryFn: () => fetchVocab('target_domain'),
  })

  const demands = demandsQuery.data ?? []
  const functions = functionsQuery.data ?? []
  const selectedDemand = demands.find((item) => item.id === demandId)
  const selectedFunction = functions.find((item) => item.id === functionId)
  const demandIssues = selectedDemand ? demandReadinessIssues(selectedDemand) : []
  const canCreate = Boolean(selectedDemand && demandIssues.length === 0)

  const clearFeedback = () => {
    setValidationIssues([])
    setServerError(null)
  }

  const updateDraft = (update: (current: FunctionDraft) => FunctionDraft) => {
    setDraft(update)
    setDirty(true)
    clearFeedback()
  }

  const changeDemand = (nextDemandId: string | undefined) => {
    if (dirty) return
    setDemandId(nextDemandId ?? null)
    setFunctionId(null)
    setCreating(false)
    setEditorOpen(false)
    setDraft(emptyDraft())
    clearFeedback()
  }

  const openFunction = (vehicleFunction: VehicleFunctionOut) => {
    if (dirty) return
    setFunctionId(vehicleFunction.id)
    setCreating(false)
    setEditorOpen(true)
    setDraft(draftFromFunction(vehicleFunction))
    setDirty(false)
    clearFeedback()
  }

  const startNewFunction = () => {
    if (!canCreate || dirty) return
    setFunctionId(null)
    setCreating(true)
    setEditorOpen(true)
    setDraft(emptyDraft())
    setDirty(false)
    clearFeedback()
  }

  const closeEditor = () => {
    if (dirty) {
      setValidationIssues(['放弃后，本次尚未保存的编辑将被丢弃。'])
      return
    }
    setEditorOpen(false)
    setCreating(false)
    setFunctionId(null)
    setDraft(emptyDraft())
    clearFeedback()
  }

  const discardDraft = () => {
    setEditorOpen(false)
    setCreating(false)
    setFunctionId(null)
    setDraft(emptyDraft())
    setDirty(false)
    clearFeedback()
  }

  const rememberSavedFunction = async (saved: VehicleFunctionOut) => {
    const key = functionQueryKey(saved.demand_point_id)
    queryClient.setQueryData<VehicleFunctionOut[]>(key, (current) => {
      if (!current) return [saved]
      const found = current.some((item) => item.id === saved.id)
      return found
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved]
    })
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: key }),
      queryClient.invalidateQueries({ queryKey: eeaQueryKeys.panorama }),
    ])
    setDemandId(saved.demand_point_id)
    setFunctionId(saved.id)
    setCreating(false)
    setEditorOpen(true)
    setDraft(draftFromFunction(saved))
    setDirty(false)
    clearFeedback()
    messageApi.success(saved.published ? '车辆功能已发布' : '车辆功能草稿已保存')
  }

  const saveDraft = async () => {
    clearFeedback()
    const issues = validateDraft(draft, selectedDemand, false)
    if (!demandId) issues.unshift('请选择需求点')
    if (creating) {
      if (!selectedDemand) issues.push('需求点数据尚未加载，暂时不能创建功能')
      else issues.push(...demandReadinessIssues(selectedDemand))
    }
    if (issues.length) {
      setValidationIssues([...new Set(issues)])
      return
    }

    setBusy('save')
    try {
      const saved = creating
        ? await createVehicleFunction(toCreatePayload(demandId!, draft))
        : functionId
          ? await patchVehicleFunction(functionId, toUpdatePayload(draft, false))
          : null
      if (!saved) {
        setValidationIssues(['请选择已保存的车辆功能，或开始新建推导。'])
        return
      }
      await rememberSavedFunction(saved)
    } catch (error) {
      setServerError(formatError(error))
    } finally {
      setBusy(null)
    }
  }

  const publishFunction = async () => {
    clearFeedback()
    const issues = validateDraft(draft, selectedDemand, true)
    if (creating || !functionId) issues.unshift('请先保存为草稿，再发布车辆功能')
    if (issues.length) {
      setValidationIssues([...new Set(issues)])
      return
    }

    setBusy('publish')
    try {
      const saved = await patchVehicleFunction(functionId!, toUpdatePayload(draft, true))
      await rememberSavedFunction(saved)
    } catch (error) {
      setServerError(formatError(error))
    } finally {
      setBusy(null)
    }
  }

  const selectedPublished = selectedFunction?.published === true
  const recommendationOptions = optionRows(recommendationQuery.data)
  const targetDomainOptions = optionRows(targetDomainQuery.data)

  return (
    <Card className="panel-card view-card" title="车辆功能正反向推导">
      {demandsQuery.isError ? (
        <Alert
          type="error"
          showIcon
          title="需求点加载失败"
          description={formatError(demandsQuery.error)}
          action={<Button size="small" onClick={() => void demandsQuery.refetch()}>重试</Button>}
        />
      ) : demandsQuery.isLoading ? (
        <Spin />
      ) : demands.length === 0 ? (
        <PlatformEmptyState title="暂无已保存需求点" description="保存真实需求点后，才能开始车辆功能推导。" />
      ) : (
        <Space orientation="vertical" size={14} style={{ width: '100%' }}>
          <div>
            <Text strong>来源需求点</Text>
            <Select
              showSearch={{ optionFilterProp: 'label' }}
              disabled={dirty || Boolean(busy)}
              value={demandId ?? undefined}
              onChange={changeDemand}
              placeholder="选择服务端已保存的需求点"
              options={demands.map((demand) => ({
                value: demand.id,
                label: `${demand.name} · ${demand.review_status ?? '未复核'}`,
              }))}
              style={{ width: '100%', marginTop: 6 }}
            />
          </div>

          {demandId && selectedDemand && demandIssues.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              title="该需求尚未满足功能推导条件"
              description={demandIssues.map((issue) => <div key={issue}>{issue}</div>)}
            />
          ) : null}

          {demandId ? (
            <div>
              <div className="pane-heading-row" style={{ marginBottom: 8 }}>
                <Text strong>已保存车辆功能</Text>
                <Button
                  type="primary"
                  onClick={startNewFunction}
                  disabled={!canCreate || dirty || Boolean(busy) || !functionsQuery.isSuccess}
                >
                  新建功能推导
                </Button>
              </div>
              {functionsQuery.isError ? (
                <Alert
                  type="error"
                  showIcon
                  title="车辆功能加载失败"
                  description={formatError(functionsQuery.error)}
                  action={<Button size="small" onClick={() => void functionsQuery.refetch()}>重试</Button>}
                />
              ) : functionsQuery.isLoading ? (
                <Spin />
              ) : functions.length === 0 ? (
                <PlatformEmptyState title="该需求暂无车辆功能" description="完成五步正向推导后，可保存为服务端草稿。" />
              ) : (
                <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                  {functions.map((vehicleFunction) => (
                    <Card
                      key={vehicleFunction.id}
                      size="small"
                      title={vehicleFunction.name}
                      extra={<Tag color={vehicleFunction.published ? 'green' : 'default'}>{vehicleFunction.published ? '已发布' : '草稿'}</Tag>}
                    >
                      <Space wrap>
                        {vehicleFunction.recommendation_level ? <Tag>{vehicleFunction.recommendation_level}</Tag> : null}
                        {vehicleFunction.target_domain ? <Tag color="blue">{vehicleFunction.target_domain}</Tag> : null}
                        <Button size="small" onClick={() => openFunction(vehicleFunction)} disabled={dirty || Boolean(busy)}>
                          {functionId === vehicleFunction.id && editorOpen ? '正在编辑' : '打开编辑'}
                        </Button>
                      </Space>
                    </Card>
                  ))}
                </Space>
              )}
            </div>
          ) : (
            <PlatformEmptyState title="请选择需求点" description="将读取该需求下服务端已保存的功能草稿与发布记录。" />
          )}

          {editorOpen ? (
            <Card
              size="small"
              title={creating ? '新建车辆功能草稿' : '编辑车辆功能'}
              extra={creating ? <Tag>未保存</Tag> : <Tag color={selectedPublished ? 'green' : 'default'}>{selectedPublished ? '已发布' : '草稿'}</Tag>}
            >
              <Space orientation="vertical" size={14} style={{ width: '100%' }}>
                {dirty ? <Alert type="info" showIcon title="当前有未保存的修改；保存或放弃前不能切换需求与功能。" /> : null}
                {!creating && selectedPublished ? (
                  <Alert type="warning" showIcon title="保存为草稿会撤销当前发布状态。发布变更时请使用“发布”提交。" />
                ) : null}

                <div>
                  <Text strong>功能名称</Text>
                  <Input
                    value={draft.name}
                    disabled={Boolean(busy)}
                    onChange={(event) => updateDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="填写由五步推导收敛出的车辆功能"
                    style={{ marginTop: 6 }}
                  />
                </div>

                <Card size="small" title="正向五步推导">
                  <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                    {FORWARD_STEPS.map((step, index) => (
                      <div key={step.key}>
                        <Text strong>{index + 1}. {step.label}</Text>
                        <TextArea
                          value={draft.forward[step.key]}
                          disabled={Boolean(busy)}
                          autoSize={{ minRows: 2, maxRows: 5 }}
                          onChange={(event) => updateDraft((current) => ({
                            ...current,
                            forward: { ...current.forward, [step.key]: event.target.value },
                          }))}
                          placeholder={step.key === 'core_needs' ? '逐条填写核心诉求，每行一项' : `填写${step.label}`}
                          style={{ marginTop: 4 }}
                        />
                      </div>
                    ))}
                  </Space>
                </Card>

                <Card size="small" title="反向验证清单">
                  <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                    <div>
                      <Text strong>必要性</Text>
                      <TextArea
                        value={draft.necessity}
                        disabled={Boolean(busy)}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        onChange={(event) => updateDraft((current) => ({ ...current, necessity: event.target.value }))}
                        placeholder="说明移除该功能后，需求是否仍可完整实现"
                        style={{ marginTop: 4 }}
                      />
                    </div>

                    <div>
                      <div className="pane-heading-row" style={{ marginBottom: 6 }}>
                        <Text strong>逐项需求覆盖</Text>
                        <Button
                          size="small"
                          disabled={Boolean(busy) || coreNeedItems(draft.forward.core_needs).length === 0}
                          onClick={() => updateDraft(syncCoverageToCoreNeeds)}
                        >
                          同步正向核心诉求
                        </Button>
                      </div>
                      {draft.coverage.length === 0 ? <Text type="secondary">尚未记录需求覆盖项。</Text> : null}
                      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                        {draft.coverage.map((item, index) => (
                          <Card key={`coverage-${index}`} size="small">
                            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                              <Input
                                value={item.need}
                                disabled={Boolean(busy)}
                                onChange={(event) => updateDraft((current) => ({
                                  ...current,
                                  coverage: current.coverage.map((row, rowIndex) => rowIndex === index ? { ...row, need: event.target.value } : row),
                                }))}
                                placeholder="需求项"
                              />
                              <TextArea
                                value={item.coverage}
                                disabled={Boolean(busy)}
                                autoSize={{ minRows: 2, maxRows: 4 }}
                                onChange={(event) => updateDraft((current) => ({
                                  ...current,
                                  coverage: current.coverage.map((row, rowIndex) => rowIndex === index ? { ...row, coverage: event.target.value } : row),
                                }))}
                                placeholder="对应覆盖说明与验证依据"
                              />
                              <Button
                                size="small"
                                danger
                                disabled={Boolean(busy)}
                                onClick={() => updateDraft((current) => ({
                                  ...current,
                                  coverage: current.coverage.filter((_, rowIndex) => rowIndex !== index),
                                }))}
                              >
                                删除该项
                              </Button>
                            </Space>
                          </Card>
                        ))}
                      </Space>
                    </div>

                    <Checkbox
                      checked={draft.fullCoverage}
                      disabled={Boolean(busy)}
                      onChange={(event) => updateDraft((current) => ({ ...current, fullCoverage: event.target.checked }))}
                    >
                      已核验并覆盖全部核心诉求
                    </Checkbox>

                    <div>
                      <Text strong>未解决矛盾</Text>
                      <TextArea
                        value={draft.unresolvedContradictions}
                        disabled={Boolean(busy)}
                        autoSize={{ minRows: 2, maxRows: 5 }}
                        onChange={(event) => updateDraft((current) => ({ ...current, unresolvedContradictions: event.target.value }))}
                        placeholder="每行记录一项未解决矛盾；没有未解决项时留空"
                        style={{ marginTop: 4 }}
                      />
                    </div>

                    <div>
                      <Text strong>正反向结论</Text>
                      <Select
                        allowClear
                        disabled={Boolean(busy)}
                        value={draft.conclusion ?? undefined}
                        onChange={(value) => updateDraft((current) => ({ ...current, conclusion: value ?? null }))}
                        options={[
                          { value: 'consistent', label: '一致' },
                          { value: 'inconsistent', label: '不一致' },
                        ]}
                        placeholder="选择经验证的结论"
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </div>

                    <Checkbox
                      checked={draft.humanConfirmed}
                      disabled={Boolean(busy)}
                      onChange={(event) => updateDraft((current) => ({ ...current, humanConfirmed: event.target.checked }))}
                    >
                      我已人工确认正反向结论一致
                    </Checkbox>
                  </Space>
                </Card>

                <Card size="small" title="功能卡片">
                  <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                    <div>
                      <Text strong>推荐等级</Text>
                      {recommendationQuery.isError ? (
                        <Alert
                          type="error"
                          showIcon
                          title="推荐等级词表加载失败"
                          description={formatError(recommendationQuery.error)}
                          action={<Button size="small" onClick={() => void recommendationQuery.refetch()}>重试</Button>}
                          style={{ marginTop: 4 }}
                        />
                      ) : null}
                      {recommendationQuery.isSuccess && recommendationOptions.length === 0 ? <Text type="secondary" style={{ display: 'block' }}>推荐等级词表暂无选项。</Text> : null}
                      <Select
                        allowClear
                        loading={recommendationQuery.isLoading}
                        disabled={!recommendationQuery.isSuccess || Boolean(busy)}
                        value={draft.recommendationLevel ?? undefined}
                        onChange={(value) => updateDraft((current) => ({ ...current, recommendationLevel: value ?? null }))}
                        options={recommendationOptions}
                        placeholder="从推荐等级词表选择"
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </div>

                    <div>
                      <Text strong>自动化等级</Text>
                      <Select
                        mode="multiple"
                        allowClear
                        disabled={Boolean(busy)}
                        value={draft.automationLevels}
                        onChange={(value) => updateDraft((current) => ({ ...current, automationLevels: value }))}
                        options={AUTOMATION_LEVELS.map((level) => ({ value: level, label: level }))}
                        placeholder="选择 L0–L5，可多选"
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </div>

                    <div>
                      <Text strong>目标域</Text>
                      {targetDomainQuery.isError ? (
                        <Alert
                          type="error"
                          showIcon
                          title="目标域词表加载失败"
                          description={formatError(targetDomainQuery.error)}
                          action={<Button size="small" onClick={() => void targetDomainQuery.refetch()}>重试</Button>}
                          style={{ marginTop: 4 }}
                        />
                      ) : null}
                      {targetDomainQuery.isSuccess && targetDomainOptions.length === 0 ? <Text type="secondary" style={{ display: 'block' }}>目标域词表暂无选项。</Text> : null}
                      <Select
                        allowClear
                        loading={targetDomainQuery.isLoading}
                        disabled={!targetDomainQuery.isSuccess || Boolean(busy)}
                        value={draft.targetDomain ?? undefined}
                        onChange={(value) => updateDraft((current) => ({ ...current, targetDomain: value ?? null }))}
                        options={targetDomainOptions}
                        placeholder="从目标域词表选择"
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </div>

                    <div>
                      <Text strong>推荐原因</Text>
                      <TextArea
                        value={draft.recommendationReason}
                        disabled={Boolean(busy)}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        onChange={(event) => updateDraft((current) => ({ ...current, recommendationReason: event.target.value }))}
                        placeholder="填写推荐理由"
                        style={{ marginTop: 4 }}
                      />
                    </div>

                    <div>
                      <Text strong>L2 与 L4 功能差异</Text>
                      <TextArea
                        value={draft.l2L4Difference}
                        disabled={Boolean(busy)}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        onChange={(event) => updateDraft((current) => ({ ...current, l2L4Difference: event.target.value }))}
                        placeholder="说明相同功能在 L2 与 L4 下的责任和执行差异"
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  </Space>
                </Card>

                {validationIssues.length ? (
                  <Alert
                    type="error"
                    showIcon
                    title="请先完成以下内容"
                    description={validationIssues.map((issue) => <div key={issue}>{issue}</div>)}
                  />
                ) : null}
                {serverError ? <Alert type="error" showIcon title="服务端未接受本次操作" description={serverError} /> : null}

                {!creating && selectedPublished ? (
                  <Text type="secondary">保存草稿会向服务端提交 published=false；发布操作会同时提交本次正向与反向验证。</Text>
                ) : null}
                {creating ? <Text type="secondary">新功能先通过 POST 保存为草稿；保存后才能通过 PATCH 发布，并在同一请求中提交两份验证记录。</Text> : null}

                <Space wrap>
                  <Button type="primary" loading={busy === 'save'} disabled={Boolean(busy)} onClick={() => void saveDraft()}>
                    保存草稿
                  </Button>
                  <Button
                    type="primary"
                    disabled={creating || !functionId || Boolean(busy)}
                    loading={busy === 'publish'}
                    onClick={() => void publishFunction()}
                  >
                    发布
                  </Button>
                  <Button disabled={Boolean(busy)} onClick={dirty ? discardDraft : closeEditor}>
                    {dirty ? '放弃未保存修改' : '关闭编辑'}
                  </Button>
                </Space>
              </Space>
            </Card>
          ) : null}
        </Space>
      )}
    </Card>
  )
}
