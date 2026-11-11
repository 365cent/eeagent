'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormInstance } from 'antd/es/form'
import { Alert, Button, Card, Empty, Form, Input, InputNumber, Select, Space, Tag, Timeline, Typography } from 'antd'
import { fetchLandingPoints, fetchStrategyAssessmentHistory, fetchStrategyFunnel, patchStrategyFunnel } from '@/lib/api/eea-api'
import type {
  AssessmentOut,
  LandingPointOut,
  StrategyClassification,
  StrategyFunnelCurrentStep,
  StrategyFunnelOut,
  StrategyFunnelPatchPayload,
  StrategyScoreDimension,
} from '@/lib/api/types'
import { formatApiDate } from '@/lib/eea-mappers'
import { PageHeader } from '@/components/shared/page-header'
import { eeaQueryKeys, useOverviewStats } from '@/hooks/use-eea-queries'

const { Paragraph, Text } = Typography

type FunnelStage = 1 | 2 | 3 | 4

type ScanForm = {
  scan_scope: string
  scan_sources_text: string
}

type Tier1Form = {
  tier1_current_business_relation: string
  tier1_future_business_relation: string
  valuable_role: string
  adaptation_decision: 'pass' | 'reject'
  adaptation_reason: string
}

type ScoreForm = {
  score_business: number | null
  rationale_business: string
  score_maturity: number | null
  rationale_maturity: string
  score_moat: number | null
  rationale_moat: string
  score_supply_chain: number | null
  rationale_supply_chain: string
  score_feasibility: number | null
  rationale_feasibility: string
}

type ClassificationForm = {
  classification: StrategyClassification
  strategy_note: string
}

type SaveVariables = {
  landingPointId: string
  payload: StrategyFunnelPatchPayload
}

const SCORE_DIMENSIONS: ReadonlyArray<{
  key: StrategyScoreDimension
  label: string
  scoreField: keyof ScoreForm
  rationaleField: keyof ScoreForm
}> = [
  { key: 'business', label: '业务匹配度', scoreField: 'score_business', rationaleField: 'rationale_business' },
  { key: 'maturity', label: '技术成熟度窗口', scoreField: 'score_maturity', rationaleField: 'rationale_maturity' },
  { key: 'moat', label: '差异化护城河', scoreField: 'score_moat', rationaleField: 'rationale_moat' },
  { key: 'supply_chain', label: '供应链生态位', scoreField: 'score_supply_chain', rationaleField: 'rationale_supply_chain' },
  { key: 'feasibility', label: '可落地性', scoreField: 'score_feasibility', rationaleField: 'rationale_feasibility' },
]

const FUNNEL_STAGES: ReadonlyArray<{ number: FunnelStage; title: string; summary: string }> = [
  { number: 1, title: '行业级全景扫描 · 求广', summary: '不遗漏颠覆性方向。' },
  { number: 2, title: 'Tier1业务场景适配 · 求准', summary: '记录当前/未来业务关系与有价值角色。' },
  { number: 3, title: '多维价值与可行性研判 · 求实', summary: '五维交叉定性评估。' },
  { number: 4, title: '落地策略分类', summary: '人工选择分类，差异化配置资源。' },
]

const CLASSIFICATIONS: StrategyClassification[] = ['前瞻布局', '短期可落地', '产业投资/生态合作']

const funnelQueryKey = eeaQueryKeys.strategyFunnel
const historyQueryKey = eeaQueryKeys.strategyHistory

function syncScanForm(form: FormInstance<ScanForm>, funnel: StrategyFunnelOut) {
  form.setFieldsValue({
    scan_scope: funnel.scan_scope ?? '',
    scan_sources_text: funnel.scan_sources?.join('\n') ?? '',
  })
}

function syncTier1Form(form: FormInstance<Tier1Form>, funnel: StrategyFunnelOut) {
  form.setFieldsValue({
    tier1_current_business_relation: funnel.tier1_current_business_relation ?? '',
    tier1_future_business_relation: funnel.tier1_future_business_relation ?? '',
    valuable_role: funnel.valuable_role ?? '',
    adaptation_decision: funnel.adaptation_decision ?? undefined,
    adaptation_reason: funnel.adaptation_reason ?? '',
  })
}

function syncScoreForm(form: FormInstance<ScoreForm>, funnel: StrategyFunnelOut) {
  form.setFieldsValue({
    score_business: funnel.score_drafts.business.score,
    rationale_business: funnel.score_drafts.business.rationale ?? '',
    score_maturity: funnel.score_drafts.maturity.score,
    rationale_maturity: funnel.score_drafts.maturity.rationale ?? '',
    score_moat: funnel.score_drafts.moat.score,
    rationale_moat: funnel.score_drafts.moat.rationale ?? '',
    score_supply_chain: funnel.score_drafts.supply_chain.score,
    rationale_supply_chain: funnel.score_drafts.supply_chain.rationale ?? '',
    score_feasibility: funnel.score_drafts.feasibility.score,
    rationale_feasibility: funnel.score_drafts.feasibility.rationale ?? '',
  })
}

function syncClassificationForm(form: FormInstance<ClassificationForm>, funnel: StrategyFunnelOut) {
  form.setFieldsValue({
    classification: funnel.classification ?? undefined,
    strategy_note: funnel.strategy_note ?? '',
  })
}

function activeStageFor(currentStep: StrategyFunnelCurrentStep): FunnelStage | null {
  switch (currentStep) {
    case 'industry_scan': return 1
    case 'tier1_adaptation':
    case 'rejected': return 2
    case 'scoring': return 3
    case 'classification': return 4
    default: return null
  }
}

function savedThroughFor(currentStep: StrategyFunnelCurrentStep): number {
  switch (currentStep) {
    case 'tier1_adaptation': return 1
    case 'scoring': return 2
    case 'classification': return 3
    case 'ready_to_finalize':
    case 'complete': return 4
    case 'rejected': return 2
    default: return 0
  }
}

function canEditStage(currentStep: StrategyFunnelCurrentStep, stage: FunnelStage): boolean {
  if (currentStep === 'pool_entry_blocked') return false
  if (currentStep === 'complete') return true
  return stage <= Math.max(activeStageFor(currentStep) ?? 0, savedThroughFor(currentStep))
}

function stageStatus(currentStep: StrategyFunnelCurrentStep, stage: FunnelStage): string {
  if (currentStep === 'pool_entry_blocked') return '筛选池未开放'
  if (currentStep === 'rejected' && stage > 2) return '未进入'
  if (stage === activeStageFor(currentStep)) return currentStep === 'rejected' ? '已拒绝，可修订' : '当前步骤'
  if (stage <= savedThroughFor(currentStep)) return '已保存'
  return '等待前序步骤'
}

function currentStepLabel(currentStep: StrategyFunnelCurrentStep): string {
  const labels: Record<StrategyFunnelCurrentStep, string> = {
    pool_entry_blocked: '等待部署边界条件',
    industry_scan: '行业级全景扫描',
    tier1_adaptation: 'Tier1业务适配',
    scoring: '五维研判',
    classification: '策略分类',
    ready_to_finalize: '待确认生成版本',
    rejected: 'Tier1适配已拒绝',
    complete: '已完成',
  }
  return labels[currentStep]
}

function valueOrEmpty(value: string | null | undefined) {
  return value?.trim() ? value : '未填写'
}

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <Text strong>{label}</Text>
      <div><Text type={value?.trim() ? undefined : 'secondary'}>{valueOrEmpty(value)}</Text></div>
    </div>
  )
}

function scorePayload(values: ScoreForm): StrategyFunnelPatchPayload {
  return {
    score_business: values.score_business,
    rationale_business: values.rationale_business.trim(),
    score_maturity: values.score_maturity,
    rationale_maturity: values.rationale_maturity.trim(),
    score_moat: values.score_moat,
    rationale_moat: values.rationale_moat.trim(),
    score_supply_chain: values.score_supply_chain,
    rationale_supply_chain: values.rationale_supply_chain.trim(),
    score_feasibility: values.score_feasibility,
    rationale_feasibility: values.rationale_feasibility.trim(),
  }
}

type StageFormProps = {
  funnel: StrategyFunnelOut
  saving: boolean
  onSubmit: (payload: StrategyFunnelPatchPayload) => void
}

function IndustryScanStageForm({ funnel, saving, onSubmit }: StageFormProps) {
  const [form] = Form.useForm<ScanForm>()
  useEffect(() => {
    syncScanForm(form, funnel)
  }, [form, funnel])
  return (
    <Form<ScanForm>
      form={form}
      layout="vertical"
      onFinish={(values) => {
        const scanSources = values.scan_sources_text.split(/\r?\n/).map((source) => source.trim()).filter(Boolean)
        onSubmit({ scan_scope: values.scan_scope.trim(), scan_sources: scanSources })
      }}
    >
      <Form.Item label="行业扫描范围" name="scan_scope" rules={[{ required: true, whitespace: true, message: '请填写行业扫描范围。' }]}>
        <Input.TextArea rows={3} placeholder="记录本次行业级全景扫描的范围。" />
      </Form.Item>
      <Form.Item
        label="扫描来源（每行一项）"
        name="scan_sources_text"
        rules={[{
          validator: (_, value) => typeof value === 'string' && value.split(/\r?\n/).some((source) => source.trim())
            ? Promise.resolve()
            : Promise.reject(new Error('请至少记录一项扫描来源。')),
        }]}
      >
        <Input.TextArea rows={4} placeholder="填写实际使用的来源标题或 URL，每行一项。" />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={saving}>保存扫描范围与来源</Button>
    </Form>
  )
}

function Tier1AdaptationStageForm({ funnel, saving, onSubmit }: StageFormProps) {
  const [form] = Form.useForm<Tier1Form>()
  useEffect(() => {
    syncTier1Form(form, funnel)
  }, [form, funnel])
  return (
    <Form<Tier1Form>
      form={form}
      layout="vertical"
      onFinish={(values) => onSubmit({
        tier1_current_business_relation: values.tier1_current_business_relation.trim(),
        tier1_future_business_relation: values.tier1_future_business_relation.trim(),
        valuable_role: values.valuable_role.trim(),
        adaptation_decision: values.adaptation_decision,
        adaptation_reason: values.adaptation_reason.trim(),
      })}
    >
      <Alert
        type="info"
        showIcon
        title="判断句：这项技术与公司现在/未来业务有什么关系，公司能否在其中承担有价值的角色？"
        style={{ marginBottom: 16 }}
      />
      <Form.Item label="当前业务关系" name="tier1_current_business_relation" rules={[{ required: true, whitespace: true, message: '请记录当前业务关系。' }]}>
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item label="未来业务关系" name="tier1_future_business_relation" rules={[{ required: true, whitespace: true, message: '请记录未来业务关系。' }]}>
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item label="公司可承担的有价值角色" name="valuable_role" rules={[{ required: true, whitespace: true, message: '请记录有价值的角色。' }]}>
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item label="适配结论" name="adaptation_decision" rules={[{ required: true, message: '请选择通过或拒绝。' }]}>
        <Select
          options={[
            { value: 'pass', label: '通过，进入五维研判' },
            { value: 'reject', label: '拒绝，退出且不评分' },
          ]}
        />
      </Form.Item>
      <Form.Item label="适配判断理由 / 退出理由" name="adaptation_reason" rules={[{ required: true, whitespace: true, message: '请填写判断理由。' }]}>
        <Input.TextArea rows={3} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={saving}>保存适配结论</Button>
    </Form>
  )
}

function ScoringStageForm({ funnel, saving, onSubmit }: StageFormProps) {
  const [form] = Form.useForm<ScoreForm>()
  useEffect(() => {
    syncScoreForm(form, funnel)
  }, [form, funnel])
  return (
    <Form<ScoreForm> form={form} layout="vertical" onFinish={(values) => onSubmit(scorePayload(values))}>
      <Paragraph type="secondary">每个维度填写 1–5 的整数与本次判断依据。综合分只显示服务器返回值。</Paragraph>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        {SCORE_DIMENSIONS.map(({ key, label, scoreField, rationaleField }) => (
          <Card key={key} size="small" title={label}>
            <Form.Item
              label="评分（1–5 整数）"
              name={scoreField}
              rules={[
                { required: true, message: '请选择 1–5 的整数。' },
                { type: 'integer', min: 1, max: 5, message: '评分必须是 1–5 的整数。' },
              ]}
            >
              <InputNumber min={1} max={5} step={1} precision={0} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item label="评分依据" name={rationaleField} rules={[{ required: true, whitespace: true, message: '请填写该维度的判断依据。' }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
          </Card>
        ))}
      </Space>
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Text strong>服务端总分：{funnel.score_total == null ? '尚未返回' : `${funnel.score_total} / 25`}</Text>
      </div>
      <Button type="primary" htmlType="submit" loading={saving}>保存五维评分与依据</Button>
    </Form>
  )
}

function ClassificationStageForm({ funnel, saving, onSubmit }: StageFormProps) {
  const [form] = Form.useForm<ClassificationForm>()
  useEffect(() => {
    syncClassificationForm(form, funnel)
  }, [form, funnel])
  return (
    <Form<ClassificationForm>
      form={form}
      layout="vertical"
      onFinish={(values) => onSubmit({
        classification: values.classification,
        strategy_note: values.strategy_note.trim(),
      })}
    >
      <Form.Item label="策略分类（三选一）" name="classification" rules={[{ required: true, message: '请选择一项分类。' }]}>
        <Select options={CLASSIFICATIONS.map((value) => ({ value, label: value }))} />
      </Form.Item>
      <Form.Item label="策略备注" name="strategy_note" rules={[{ required: true, whitespace: true, message: '请填写策略备注。' }]}>
        <Input.TextArea rows={4} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={saving}>保存分类与策略备注</Button>
    </Form>
  )
}

function CurrentAssessment({ assessment, funnel }: { assessment: AssessmentOut | null; funnel: StrategyFunnelOut }) {
  if (!assessment) {
    return <Alert type="warning" showIcon title="流程标记为已完成，但服务端未返回当前版本详情。请刷新或检查接口响应。" />
  }

  return (
    <Card size="small" title={`当前版本 v${assessment.version}`}>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Space wrap>
          <Tag color="green">当前版本</Tag>
          <Text strong>分类：{assessment.classification}</Text>
          <Text strong>服务端总分：{assessment.score_total} / 25</Text>
        </Space>
        <div>
          {SCORE_DIMENSIONS.map(({ key, label }) => {
            const draft = funnel.score_drafts[key]
            const rationale = assessment.score_rationales?.[key] ?? draft.rationale
            return (
              <div key={key}>
                <Text strong>{label}：{draft.score ?? '—'} / 5</Text>
                <Paragraph type="secondary" style={{ marginBottom: 8 }}>{valueOrEmpty(rationale)}</Paragraph>
              </div>
            )
          })}
        </div>
        <ReadOnlyField label="策略备注" value={assessment.strategy_note} />
        <Text type="secondary">操作者：{assessment.operator_subject ?? '—'} · 时间：{formatApiDate(assessment.assessed_at)}</Text>
      </Space>
    </Card>
  )
}

function SavedStage({ stage, funnel }: { stage: FunnelStage; funnel: StrategyFunnelOut }) {
  if (stage === 1) {
    return (
      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
        <ReadOnlyField label="行业扫描范围" value={funnel.scan_scope} />
        <div>
          <Text strong>扫描来源</Text>
          {funnel.scan_sources?.length ? (
            <ul>{funnel.scan_sources.map((source, index) => <li key={`${source}-${index}`}>{source}</li>)}</ul>
          ) : <div><Text type="secondary">暂无来源记录</Text></div>}
        </div>
        <Text type="secondary">部署边界证据：{funnel.deployment_boundary_evidence_ids.length} 项</Text>
      </Space>
    )
  }

  if (stage === 2) {
    return (
      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
        <Space wrap>
          <Text strong>适配结论：</Text>
          <Tag color={funnel.adaptation_decision === 'pass' ? 'green' : 'red'}>
            {funnel.adaptation_decision === 'pass' ? '通过' : '拒绝 / 退出'}
          </Tag>
        </Space>
        <ReadOnlyField label="当前业务关系" value={funnel.tier1_current_business_relation} />
        <ReadOnlyField label="未来业务关系" value={funnel.tier1_future_business_relation} />
        <ReadOnlyField label="有价值的角色" value={funnel.valuable_role} />
        <ReadOnlyField label="判断理由" value={funnel.adaptation_reason} />
      </Space>
    )
  }

  if (stage === 3) {
    return (
      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
        {SCORE_DIMENSIONS.map(({ key, label }) => {
          const draft = funnel.score_drafts[key]
          return (
            <div key={key}>
              <Text strong>{label}：{draft.score ?? '—'} / 5</Text>
              <Paragraph type="secondary" style={{ marginBottom: 8 }}>{valueOrEmpty(draft.rationale)}</Paragraph>
            </div>
          )
        })}
        <Text strong>服务端总分：{funnel.score_total == null ? '尚未返回' : `${funnel.score_total} / 25`}</Text>
      </Space>
    )
  }

  return (
    <Space orientation="vertical" size={10} style={{ width: '100%' }}>
      <ReadOnlyField label="人工选择的分类" value={funnel.classification} />
      <ReadOnlyField label="策略备注" value={funnel.strategy_note} />
    </Space>
  )
}

export function StrategyFunnelWorkbench() {
  const queryClient = useQueryClient()
  const [landingPointId, setLandingPointId] = useState<string>()
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const landingPointsQuery = useQuery({
    queryKey: ['eea', 'landing-points'],
    queryFn: () => fetchLandingPoints(),
  })
  const overviewQuery = useOverviewStats()
  const funnelQuery = useQuery({
    queryKey: funnelQueryKey(landingPointId ?? ''),
    queryFn: () => fetchStrategyFunnel(landingPointId!),
    enabled: Boolean(landingPointId),
    refetchOnWindowFocus: false,
  })
  const historyQuery = useQuery({
    queryKey: historyQueryKey(landingPointId ?? ''),
    queryFn: () => fetchStrategyAssessmentHistory(landingPointId!),
    enabled: Boolean(landingPointId),
    refetchOnWindowFocus: false,
  })

  const funnel = funnelQuery.data
  const activeStage = funnel ? activeStageFor(funnel.current_step) : null
  const savedThrough = funnel ? savedThroughFor(funnel.current_step) : 0
  const formStage = editingStage ?? activeStage
  const lastFinalizedAssessment = funnel?.latest_assessment
    ?? historyQuery.data?.find((assessment) => assessment.is_current)
    ?? [...(historyQuery.data ?? [])].sort((left, right) => right.version - left.version)[0]
  const selectedLandingPoint = useMemo(
    () => landingPointsQuery.data?.find((row) => row.id === landingPointId),
    [landingPointId, landingPointsQuery.data],
  )

  useEffect(() => {
    setEditingStage(null)
  }, [landingPointId])

  const saveMutation = useMutation({
    mutationFn: ({ landingPointId: id, payload }: SaveVariables) => patchStrategyFunnel(id, payload),
    onSuccess: async (updatedFunnel, variables) => {
      queryClient.setQueryData(funnelQueryKey(variables.landingPointId), updatedFunnel)
      setEditingStage(null)
      setNotice({
        type: 'success',
        text: variables.payload.finalize ? '已生成新的战略研判版本。' : '本步骤已保存。',
      })
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: funnelQueryKey(variables.landingPointId) }),
        queryClient.invalidateQueries({ queryKey: historyQueryKey(variables.landingPointId) }),
        queryClient.invalidateQueries({ queryKey: ['eea', 'overview'] }),
      ]
      if (variables.payload.finalize) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: ['eea', 'assessments'] }),
        )
      }
      await Promise.all(invalidations)
    },
    onError: (error) => {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : '保存失败，请重试。' })
    },
  })

  function submit(payload: StrategyFunnelPatchPayload) {
    if (!landingPointId) return
    setNotice(null)
    saveMutation.mutate({ landingPointId, payload })
  }

  function renderStageForm(stage: FunnelStage) {
    if (!funnel) return null
    const stageProps = { funnel, saving: saveMutation.isPending, onSubmit: submit }
    if (stage === 1) return <IndustryScanStageForm {...stageProps} />
    if (stage === 2) return <Tier1AdaptationStageForm {...stageProps} />
    if (stage === 3) return <ScoringStageForm {...stageProps} />
    return <ClassificationStageForm {...stageProps} />
  }

  function renderStage(stage: FunnelStage, title: string, summary: string) {
    const isForm = formStage === stage && canEditStage(funnel!.current_step, stage)
    const isSaved = stage <= savedThrough
    const rejectedBeforeStage = funnel!.current_step === 'rejected' && stage > 2

    return (
      <Card
        key={stage}
        className="panel-card"
        title={<Space wrap><Text strong>{stage}. {title}</Text><Tag color={isForm ? 'blue' : isSaved ? 'green' : 'default'}>{stageStatus(funnel!.current_step, stage)}</Tag></Space>}
        extra={isSaved && canEditStage(funnel!.current_step, stage) && !isForm
          ? <Button type="link" onClick={() => { setNotice(null); setEditingStage(stage) }}>修改</Button>
          : null}
      >
        <Paragraph type="secondary">{summary}</Paragraph>
        {isForm ? (
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            {renderStageForm(stage)}
            {editingStage !== null && editingStage !== activeStage ? (
              <Button onClick={() => setEditingStage(null)} disabled={saveMutation.isPending}>取消修改</Button>
            ) : null}
          </Space>
        ) : isSaved ? (
          <SavedStage stage={stage} funnel={funnel!} />
        ) : rejectedBeforeStage ? (
          <Text type="secondary">该项在 Tier1 适配步骤被滤除，未进入评分与策略分类。</Text>
        ) : (
          <Text type="secondary">完成前序步骤后开放。</Text>
        )}
      </Card>
    )
  }

  const retryLandingPoints = () => { void landingPointsQuery.refetch() }

  return (
    <div>
      <PageHeader
        eyebrow="05 · 战略研判"
        title="创新组合"
        description="按行业扫描、Tier1适配、五维研判和策略分类顺序推进；每个判断由服务端保存并保留版本。"
      />

      <Card className="panel-card" title="战略漏斗当前数量">
        <Paragraph type="secondary">
          按数据库中每个技术落脚点的当前步骤独占计数；待定稿与已定稿并入第 4 步，拒绝与未满足入池条件的落脚点单独列出。
        </Paragraph>
        {overviewQuery.isError ? (
          <Alert
            type="error"
            showIcon
            title="战略漏斗数量加载失败。"
            description={overviewQuery.error instanceof Error ? overviewQuery.error.message : undefined}
            action={<Button size="small" onClick={() => { void overviewQuery.refetch() }}>重试</Button>}
          />
        ) : overviewQuery.isLoading ? (
          <Text type="secondary">正在读取数据库计数…</Text>
        ) : overviewQuery.data?.strategy_funnel ? (
          <Space wrap>
            <Tag color="blue">第 1 步 · 行业扫描：{overviewQuery.data.strategy_funnel.industry_scan}</Tag>
            <Tag color="blue">第 2 步 · Tier1 适配：{overviewQuery.data.strategy_funnel.tier1_adaptation}</Tag>
            <Tag color="blue">第 3 步 · 五维研判：{overviewQuery.data.strategy_funnel.scoring}</Tag>
            <Tag color="blue">第 4 步 · 策略分类：{overviewQuery.data.strategy_funnel.classification}</Tag>
            <Tag color="orange">适配拒绝：{overviewQuery.data.strategy_funnel.rejected}</Tag>
            <Tag>未满足入池条件：{overviewQuery.data.strategy_funnel.pool_entry_blocked}</Tag>
          </Space>
        ) : (
          <Text type="secondary">当前服务尚未提供数据库漏斗计数。</Text>
        )}
      </Card>

      <Card className="panel-card" title="选择技术落脚点">
        {landingPointsQuery.isError ? (
          <Alert type="error" showIcon title="技术落脚点加载失败。" description={landingPointsQuery.error instanceof Error ? landingPointsQuery.error.message : undefined} action={<Button size="small" onClick={retryLandingPoints}>重试</Button>} />
        ) : landingPointsQuery.isLoading ? (
          <Text type="secondary">正在加载技术落脚点…</Text>
        ) : landingPointsQuery.data?.length ? (
          <Select
            showSearch={{ optionFilterProp: 'label' }}
            value={landingPointId}
            onChange={(value) => { setLandingPointId(value); setEditingStage(null); setNotice(null) }}
            placeholder="选择已保存的技术落脚点"
            options={landingPointsQuery.data.map((item: LandingPointOut) => ({
              value: item.id,
              label: item.domain_name ? `${item.name} · ${item.domain_name}` : item.name,
            }))}
            style={{ width: '100%' }}
          />
        ) : (
          <Empty description="当前没有可进入战略研判的技术落脚点。请先完成前序技术拆解与部署标准登记。" />
        )}
      </Card>

      {landingPointId && funnelQuery.isLoading ? (
        <Card className="panel-card"><Text type="secondary">正在加载该落脚点的战略流程…</Text></Card>
      ) : null}

      {landingPointId && funnelQuery.isError ? (
        <Alert
          type="error"
          showIcon
          title="战略流程加载失败。"
          description={funnelQuery.error instanceof Error ? funnelQuery.error.message : undefined}
          action={<Button size="small" onClick={() => { void funnelQuery.refetch() }}>重试</Button>}
          style={{ marginTop: 16 }}
        />
      ) : null}

      {funnel ? (
        <Space orientation="vertical" size={16} style={{ width: '100%', marginTop: 16 }}>
          <Card className="panel-card" title={selectedLandingPoint?.name ?? '战略四步漏斗'}>
            <Space wrap>
              <Tag color={funnel.pool_eligible ? 'green' : 'default'}>{funnel.pool_eligible ? '筛选池可进入' : '尚未进入筛选池'}</Tag>
              <Text>当前状态：{currentStepLabel(funnel.current_step)}</Text>
              <Text type="secondary">最近操作者：{funnel.updated_by ?? '—'}</Text>
              <Text type="secondary">更新时间：{formatApiDate(funnel.updated_at)}</Text>
            </Space>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">部署边界证据：{funnel.deployment_boundary_evidence_ids.length} 项</Text>
            </div>
          </Card>

          {!funnel.pool_eligible || funnel.current_step === 'pool_entry_blocked' ? (
            <Alert
              type="warning"
              showIcon
              title="该落脚点尚不满足筛选池进入条件。"
              description="服务端要求至少一项已保存且有实质内容的部署标准后，才能开始行业扫描。"
            />
          ) : null}

          {funnel.current_step === 'rejected' ? (
            <Alert type="warning" showIcon title="该技术已在 Tier1 适配步骤拒绝。" description="当前结论不进入五维评分与策略分类；修改适配结论时，评分需重新填写。" />
          ) : null}

          {funnel.current_step !== 'complete' && lastFinalizedAssessment ? (
            <Space orientation="vertical" size={12} style={{ width: '100%' }}>
              <Alert
                type="warning"
                showIcon
                title="上次已生成版本，当前依据待复核"
                description="以下记录仅作为最近一次定稿版本参考；当前流程状态与输入以本页的漏斗记录为准。"
              />
              <Card className="panel-card" title={`上次已生成版本参考 · v${lastFinalizedAssessment.version}`}>
                <Space orientation="vertical" size={8}>
                  <Text>上次分类：{lastFinalizedAssessment.classification}</Text>
                  <ReadOnlyField label="上次策略备注" value={lastFinalizedAssessment.strategy_note} />
                  <Text type="secondary">操作者：{lastFinalizedAssessment.operator_subject ?? '—'} · 时间：{formatApiDate(lastFinalizedAssessment.assessed_at)}</Text>
                </Space>
              </Card>
            </Space>
          ) : null}

          <div>
            <Space wrap>
              {FUNNEL_STAGES.map((stage) => (
                <Tag key={stage.number} color={stage.number === activeStage ? 'blue' : stage.number <= savedThrough ? 'green' : 'default'}>
                  {stage.number} · {stage.title}
                </Tag>
              ))}
            </Space>
          </div>

          {notice ? <Alert type={notice.type} showIcon title={notice.text} /> : null}

          {FUNNEL_STAGES.map(({ number, title, summary }) => renderStage(number, title, summary))}

          {funnel.current_step === 'ready_to_finalize' ? (
            <Card className="panel-card" title="确认并生成当前版本">
              <Space orientation="vertical" size={12}>
                <Text>五维分数、逐维依据、人工分类与策略备注已保存。点击后由服务端计算总分并追加一个版本。</Text>
                <Button type="primary" loading={saveMutation.isPending} onClick={() => submit({ finalize: true })}>
                  确认并生成新版本
                </Button>
              </Space>
            </Card>
          ) : null}

          {funnel.current_step === 'complete' ? (
            <Card className="panel-card" title="当前战略研判">
              <CurrentAssessment assessment={funnel.latest_assessment} funnel={funnel} />
            </Card>
          ) : null}

          <Card className="panel-card" title="当前与历史版本">
            {historyQuery.isError ? (
              <Alert
                type="error"
                showIcon
                title="版本历史加载失败。"
                description={historyQuery.error instanceof Error ? historyQuery.error.message : undefined}
                action={<Button size="small" onClick={() => { void historyQuery.refetch() }}>重试</Button>}
              />
            ) : historyQuery.isLoading ? (
              <Text type="secondary">正在加载版本记录…</Text>
            ) : historyQuery.data?.length ? (
              <Timeline
                items={historyQuery.data.map((assessment: AssessmentOut) => ({
                  color: assessment.is_current ? 'green' : 'blue',
                  children: (
                    <Space orientation="vertical" size={4}>
                      <Space wrap>
                        <Text strong>版本 v{assessment.version}</Text>
                        <Tag color={assessment.is_current ? (funnel.current_step === 'complete' ? 'green' : 'orange') : 'default'}>
                          {assessment.is_current
                            ? funnel.current_step === 'complete' ? '当前版本' : '最近定稿 · 待复核'
                            : '历史'}
                        </Tag>
                        <Text>{assessment.classification}</Text>
                      </Space>
                      <Text type="secondary">操作者：{assessment.operator_subject ?? '—'} · 时间：{formatApiDate(assessment.assessed_at)}</Text>
                      <Text type="secondary">策略备注：{valueOrEmpty(assessment.strategy_note)}</Text>
                    </Space>
                  ),
                }))}
              />
            ) : (
              <Empty description="尚无已生成的战略研判版本。" />
            )}
          </Card>
        </Space>
      ) : null}
    </div>
  )
}
