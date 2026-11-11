'use client'

import { Fragment, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { App as AntApp, Alert, AutoComplete, Button, Card, Input, Select, Space, Spin, Tag, Typography } from 'antd'
import { EeaApiError } from '@/lib/api/client'
import {
  createLandingPoint,
  fetchLandingPointStandards,
  fetchLandingPoints,
  fetchVehicleFunctions,
  fetchVocab,
  patchLandingPoint,
  putLandingPointStandard,
} from '@/lib/api/eea-api'
import type {
  LandingPointCreatePayload,
  LandingPointOut,
  LandingPointStandardConstraint,
  LandingPointStandardGrid,
  LandingPointStandardOut,
  LandingPointStandardPhase,
  LandingPointStandardUpsert,
  LandingPointUpdatePayload,
  VehicleFunctionOut,
  VocabOut,
} from '@/lib/api/types'
import { eeaQueryKeys } from '@/hooks/use-eea-queries'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { STANDARD_CONSTRAINTS, STANDARD_PHASES } from '@/features/technology/standards'

const { Text } = Typography
const { TextArea } = Input

const PHASES = STANDARD_PHASES
const CONSTRAINTS = STANDARD_CONSTRAINTS
const allFunctionsKey = eeaQueryKeys.vehicleFunctions(null)
const landingPointsKey = eeaQueryKeys.landingPointsForFunction
const standardsKey = eeaQueryKeys.landingPointStandards

type EditorMode = 'create' | 'edit' | 'view' | null

type LandingPointDraft = {
  name: string
  domain: string
  roleDescription: string
}

type StandardConflict = {
  phase: LandingPointStandardPhase
  constraintType: LandingPointStandardConstraint
  latest: LandingPointStandardOut | null
  attemptedValue: string | null
}

function emptyDraft(): LandingPointDraft {
  return { name: '', domain: '', roleDescription: '' }
}

function draftFromLandingPoint(point: LandingPointOut): LandingPointDraft {
  return {
    name: point.name,
    domain: point.domain_name ?? '',
    roleDescription: point.role_description ?? '',
  }
}

function standardCellKey(phase: LandingPointStandardPhase, constraintType: LandingPointStandardConstraint) {
  return `${phase}:${constraintType}`
}

function findStandard(
  cells: LandingPointStandardOut[] | undefined,
  phase: LandingPointStandardPhase,
  constraintType: LandingPointStandardConstraint,
): LandingPointStandardOut | null {
  return cells?.find((cell) => cell.phase === phase && cell.constraint_type === constraintType) ?? null
}

function sameStandard(left: LandingPointStandardOut | null, right: LandingPointStandardOut | null): boolean {
  if (!left || !right) return left === right
  return left.id === right.id && left.requirement_text === right.requirement_text
}

function errorMessage(error: unknown): string {
  return error instanceof EeaApiError ? error.message : String(error)
}

function persistedState(cell: LandingPointStandardOut | null): { label: string; color: string } {
  if (!cell) return { label: '尚未填写', color: 'default' }
  if (cell.requirement_text === null) return { label: '明确留空', color: 'gold' }
  return { label: '有文本', color: 'blue' }
}

export function LandingPointWorkbench() {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null)
  const [activeLandingPointId, setActiveLandingPointId] = useState<string | null>(null)
  const [mode, setMode] = useState<EditorMode>(null)
  const [draft, setDraft] = useState<LandingPointDraft>(emptyDraft)
  const [detailsDirty, setDetailsDirty] = useState(false)
  const [cellEditingKey, setCellEditingKey] = useState<string | null>(null)
  const [cellTextDraft, setCellTextDraft] = useState('')
  const [cellBase, setCellBase] = useState<LandingPointStandardOut | null>(null)
  const [cellConflict, setCellConflict] = useState<StandardConflict | null>(null)
  const [busy, setBusy] = useState<'landing-point' | 'standard' | null>(null)
  const [formIssues, setFormIssues] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [standardError, setStandardError] = useState<string | null>(null)
  const [guardMessage, setGuardMessage] = useState<string | null>(null)

  const functionsQuery = useQuery({ queryKey: allFunctionsKey, queryFn: () => fetchVehicleFunctions() })
  const domainsQuery = useQuery({
    queryKey: eeaQueryKeys.vocab('domain'),
    queryFn: () => fetchVocab('domain'),
  })
  const pointsQuery = useQuery({
    queryKey: landingPointsKey(selectedFunctionId),
    queryFn: () => fetchLandingPoints(selectedFunctionId ?? undefined),
    enabled: Boolean(selectedFunctionId),
  })
  const standardsQuery = useQuery({
    queryKey: activeLandingPointId ? standardsKey(activeLandingPointId) : ['eea', 'landing-point-standards', 'none'],
    queryFn: () => fetchLandingPointStandards(activeLandingPointId!),
    enabled: Boolean(activeLandingPointId),
  })

  const functions = functionsQuery.data ?? []
  const domainVocabulary = domainsQuery.data ?? []
  const selectedFunction = functions.find((item) => item.id === selectedFunctionId)
  const landingPoints = pointsQuery.data ?? []
  const activeLandingPoint = landingPoints.find((item) => item.id === activeLandingPointId)
  const standardCells = standardsQuery.data?.cells ?? []
  const unsavedCellDraft = Boolean(cellEditingKey)
  const hasUnsavedWork = detailsDirty || unsavedCellDraft
  const canCreate = Boolean(
    selectedFunction?.published
    && domainsQuery.isSuccess
    && domainVocabulary.length > 0
    && !busy
    && !hasUnsavedWork,
  )

  const selectFunction = (nextId: string | undefined) => {
    if (hasUnsavedWork || busy) {
      setGuardMessage('请先保存或取消当前修改，再切换车辆功能。')
      return
    }
    setSelectedFunctionId(nextId ?? null)
    setActiveLandingPointId(null)
    setMode(null)
    setDraft(emptyDraft())
    setFormIssues([])
    setFormError(null)
    setStandardError(null)
    setCellConflict(null)
    setGuardMessage(null)
  }

  const openLandingPoint = (point: LandingPointOut) => {
    if (hasUnsavedWork || busy) {
      setGuardMessage('请先保存或取消当前修改，再打开其他技术落脚点。')
      return
    }
    setActiveLandingPointId(point.id)
    setDraft(draftFromLandingPoint(point))
    setMode('view')
    setFormIssues([])
    setFormError(null)
    setStandardError(null)
    setCellConflict(null)
    setGuardMessage(null)
  }

  const startCreate = () => {
    if (!selectedFunction?.published || !canCreate) return
    setActiveLandingPointId(null)
    setDraft(emptyDraft())
    setMode('create')
    setDetailsDirty(false)
    setFormIssues([])
    setFormError(null)
    setGuardMessage(null)
  }

  const startEdit = () => {
    if (!activeLandingPoint || hasUnsavedWork || busy) return
    setDraft(draftFromLandingPoint(activeLandingPoint))
    setMode('edit')
    setDetailsDirty(false)
    setFormIssues([])
    setFormError(null)
  }

  const cancelDetails = () => {
    if (mode === 'create') {
      setActiveLandingPointId(null)
      setMode(null)
      setDraft(emptyDraft())
    } else if (activeLandingPoint) {
      setDraft(draftFromLandingPoint(activeLandingPoint))
      setMode('view')
    }
    setDetailsDirty(false)
    setFormIssues([])
    setFormError(null)
  }

  const updateDraft = (field: keyof LandingPointDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setDetailsDirty(true)
    setFormIssues([])
    setFormError(null)
    setGuardMessage(null)
  }

  const saveLandingPoint = async () => {
    setFormError(null)
    const issues: string[] = []
    if (!draft.name.trim()) issues.push('请填写技术落脚点名称')
    if (!domainsQuery.isSuccess) issues.push('技术域词表尚未成功加载')
    else if (!draft.domain.trim()) issues.push('请从服务端 domain 词表选择技术域，或输入一个新域名')
    if (mode === 'create' && !selectedFunction?.published) issues.push('技术落脚点只能关联已发布功能')
    if (mode !== 'create' && (mode !== 'edit' || !activeLandingPointId)) issues.push('请选择要编辑的技术落脚点')
    if (issues.length) {
      setFormIssues(issues)
      return
    }

    setBusy('landing-point')
    try {
      const roleDescription = draft.roleDescription.trim() ? draft.roleDescription : null
      let saved: LandingPointOut
      if (mode === 'create' && selectedFunctionId) {
        const payload: LandingPointCreatePayload = {
          vehicle_function_id: selectedFunctionId,
          name: draft.name.trim(),
          domain: draft.domain.trim(),
          role_description: roleDescription,
        }
        saved = await createLandingPoint(payload)
      } else if (mode === 'edit' && activeLandingPointId) {
        const payload: LandingPointUpdatePayload = {
          name: draft.name.trim(),
          domain: draft.domain.trim(),
          role_description: roleDescription,
        }
        saved = await patchLandingPoint(activeLandingPointId, payload)
      } else {
        setFormIssues(['当前工作状态不能保存技术落脚点'])
        return
      }

      queryClient.setQueryData<LandingPointOut[]>(landingPointsKey(selectedFunctionId), (current) => {
        if (!current) return [saved]
        const exists = current.some((point) => point.id === saved.id)
        return exists
          ? current.map((point) => point.id === saved.id ? saved : point)
          : [...current, saved]
      })
      setActiveLandingPointId(saved.id)
      setDraft(draftFromLandingPoint(saved))
      setMode('view')
      setDetailsDirty(false)
      setFormIssues([])
      setGuardMessage(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eeaQueryKeys.landingPoints }),
        queryClient.invalidateQueries({ queryKey: eeaQueryKeys.panorama }),
        queryClient.invalidateQueries({ queryKey: eeaQueryKeys.vocab('domain') }),
      ])
      messageApi.success(mode === 'create' ? '技术落脚点已创建' : '技术落脚点已更新')
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setBusy(null)
    }
  }

  const openCellEditor = (phase: LandingPointStandardPhase, constraintType: LandingPointStandardConstraint) => {
    if (cellEditingKey) {
      setGuardMessage('请先保存或取消当前标准格编辑，再打开其他格子。')
      return
    }
    if (detailsDirty || busy || !standardsQuery.isSuccess) return
    const cell = findStandard(standardCells, phase, constraintType)
    setCellEditingKey(standardCellKey(phase, constraintType))
    setCellTextDraft(cell?.requirement_text ?? '')
    setCellBase(cell)
    setCellConflict(null)
    setStandardError(null)
  }

  const closeCellEditor = () => {
    setCellEditingKey(null)
    setCellTextDraft('')
    setCellBase(null)
    setCellConflict(null)
    setStandardError(null)
    setGuardMessage(null)
  }

  const saveStandardCell = async (
    phase: LandingPointStandardPhase,
    constraintType: LandingPointStandardConstraint,
    requirementText: string | null,
    allowConflictOverwrite = false,
  ) => {
    if (!activeLandingPointId || !standardsQuery.isSuccess) return
    setStandardError(null)
    setBusy('standard')
    try {
      if (!allowConflictOverwrite) {
        const latestGrid = await fetchLandingPointStandards(activeLandingPointId)
        const latestCell = findStandard(latestGrid.cells, phase, constraintType)
        if (!sameStandard(cellBase, latestCell)) {
          queryClient.setQueryData<LandingPointStandardGrid>(standardsKey(activeLandingPointId), latestGrid)
          setCellConflict({ phase, constraintType, latest: latestCell, attemptedValue: requirementText })
          return
        }
      }

      const payload: LandingPointStandardUpsert = {
        phase,
        constraint_type: constraintType,
        requirement_text: requirementText,
      }
      const updatedGrid = await putLandingPointStandard(activeLandingPointId, payload)
      queryClient.setQueryData<LandingPointStandardGrid>(standardsKey(activeLandingPointId), updatedGrid)
      closeCellEditor()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eeaQueryKeys.landingPoints }),
        queryClient.invalidateQueries({ queryKey: eeaQueryKeys.panorama }),
        queryClient.invalidateQueries({ queryKey: eeaQueryKeys.trace(activeLandingPointId) }),
      ])
      messageApi.success(requirementText === null ? '该标准格已明确留空' : '标准条款已保存')
    } catch (error) {
      setStandardError(errorMessage(error))
    } finally {
      setBusy(null)
    }
  }

  const loadLatestCell = () => {
    if (!cellConflict) return
    setCellBase(cellConflict.latest)
    setCellTextDraft(cellConflict.latest?.requirement_text ?? '')
    setCellConflict(null)
    setStandardError(null)
  }

  const functionOptions = functions.map((vehicleFunction: VehicleFunctionOut) => ({
    value: vehicleFunction.id,
    label: `${vehicleFunction.name} · ${vehicleFunction.published ? '已发布' : '未发布'}`,
  }))
  const domainOptions = domainVocabulary.map((entry: VocabOut) => ({ value: entry.name, label: entry.name }))

  return (
    <Card className="panel-card view-card" title="车辆功能 → 技术落脚点工作台">
      <Space orientation="vertical" size={14} style={{ width: '100%' }}>
        <div>
          <Text strong>车辆功能</Text>
          {functionsQuery.isError ? (
            <Alert
              type="error"
              showIcon
              title="功能列表加载失败"
              description={errorMessage(functionsQuery.error)}
              action={<Button size="small" onClick={() => void functionsQuery.refetch()}>重试</Button>}
              style={{ marginTop: 6 }}
            />
          ) : null}
          {functionsQuery.isSuccess && functions.length === 0 ? (
            <PlatformEmptyState title="暂无已保存车辆功能" description="先完成车辆功能推导并保存，再从真实功能关联技术落脚点。" />
          ) : null}
          <Select
            showSearch={{ optionFilterProp: 'label' }}
            loading={functionsQuery.isLoading}
            disabled={!functionsQuery.isSuccess || Boolean(busy)}
            value={selectedFunctionId ?? undefined}
            onChange={selectFunction}
            options={functionOptions}
            placeholder="选择服务端车辆功能"
            style={{ width: '100%', marginTop: 5 }}
          />
        </div>

        {guardMessage ? <Alert type="warning" showIcon title={guardMessage} /> : null}
        {selectedFunction && !selectedFunction.published ? (
          <Alert type="info" showIcon title="该功能尚未发布；可查看已有落脚点，但不能新增落脚点。" />
        ) : null}
        {selectedFunction?.published && domainsQuery.isLoading ? (
          <Text type="secondary">正在读取服务端 domain 词表；加载完成前不能新增落脚点。</Text>
        ) : null}
        {selectedFunction?.published && domainsQuery.isError ? (
          <Alert
            type="error"
            showIcon
            title="domain 词表加载失败，暂时不能新增落脚点"
            description={errorMessage(domainsQuery.error)}
            action={<Button size="small" onClick={() => void domainsQuery.refetch()}>重试</Button>}
          />
        ) : null}
        {selectedFunction?.published && domainsQuery.isSuccess && domainVocabulary.length === 0 ? (
          <Alert type="info" showIcon title="服务端 domain 词表暂无选项，暂时不能新增落脚点。" />
        ) : null}

        {selectedFunctionId ? (
          <Card
            size="small"
            title="已保存技术落脚点"
            extra={(
              <Button type="primary" onClick={startCreate} disabled={!canCreate}>
                新增落脚点
              </Button>
            )}
          >
            {pointsQuery.isError ? (
              <Alert
                type="error"
                showIcon
                title="技术落脚点加载失败"
                description={errorMessage(pointsQuery.error)}
                action={<Button size="small" onClick={() => void pointsQuery.refetch()}>重试</Button>}
                style={{ marginBottom: 10 }}
              />
            ) : null}
            {pointsQuery.isLoading && !pointsQuery.data ? <Spin description="正在加载技术落脚点" /> : null}
            {pointsQuery.isSuccess && landingPoints.length === 0 ? (
              <PlatformEmptyState
                title="该功能暂无技术落脚点"
                description={selectedFunction?.published ? '从服务端 domain 词表选择技术域后，可新增真实落脚点。' : '仅已发布功能可以新增落脚点。'}
              />
            ) : null}
            {landingPoints.length > 0 ? (
              <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                {landingPoints.map((point) => (
                  <Card key={point.id} size="small" variant="outlined">
                    <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                      <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Space wrap>
                          <Text strong>{point.name}</Text>
                          <Tag color="blue">{point.domain_name || '域信息缺失'}</Tag>
                        </Space>
                        <Button size="small" onClick={() => openLandingPoint(point)} disabled={Boolean(busy)}>
                          查看与编辑
                        </Button>
                      </Space>
                      <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
                        {point.role_description || '未填写功能内角色说明'}
                      </Text>
                      <Text type="secondary">已保存标准格：{point.standard_count ?? '—'}</Text>
                    </Space>
                  </Card>
                ))}
              </Space>
            ) : null}
          </Card>
        ) : null}

        {mode ? (
          <Card
            size="small"
            title={mode === 'create' ? '新增技术落脚点' : mode === 'edit' ? '编辑技术落脚点' : '技术落脚点详情'}
            extra={mode === 'view' && activeLandingPoint ? <Button size="small" onClick={startEdit} disabled={Boolean(busy)}>编辑基本信息</Button> : null}
          >
            {mode === 'view' ? (
              <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                <Text><Text strong>名称：</Text>{draft.name}</Text>
                <Text><Text strong>技术域：</Text>{draft.domain || '域信息缺失'}</Text>
                <div>
                  <Text strong>功能内角色说明</Text>
                  <Text style={{ display: 'block', whiteSpace: 'pre-wrap', marginTop: 4 }}>
                    {draft.roleDescription || '未填写'}
                  </Text>
                </div>
              </Space>
            ) : (
              <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                <div>
                  <Text strong>名称</Text>
                  <Input
                    value={draft.name}
                    disabled={Boolean(busy)}
                    onChange={(event) => updateDraft('name', event.target.value)}
                    placeholder="填写技术落脚点名称"
                    style={{ marginTop: 5 }}
                  />
                </div>
                <div>
                  <Text strong>技术域</Text>
                  {domainsQuery.isError ? (
                    <Alert
                      type="error"
                      showIcon
                      title="domain 词表加载失败"
                      description={errorMessage(domainsQuery.error)}
                      action={<Button size="small" onClick={() => void domainsQuery.refetch()}>重试</Button>}
                      style={{ marginTop: 5 }}
                    />
                  ) : null}
                  {domainsQuery.isSuccess && domainOptions.length === 0 ? (
                    <Text type="secondary" style={{ display: 'block', marginTop: 5 }}>domain 词表暂无选项，当前无法创建或更新技术域。</Text>
                  ) : null}
                  <AutoComplete
                    disabled={!domainsQuery.isSuccess || Boolean(busy)}
                    value={draft.domain || undefined}
                    onChange={(value) => updateDraft('domain', value ?? '')}
                    options={domainOptions}
                    placeholder="选择服务端词表，或输入新技术域名称"
                    style={{ width: '100%', marginTop: 5 }}
                  />
                  <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                    词表选项来自服务端；新输入的域名会在保存时加入共享词表，供其他落脚点复用。
                  </Text>
                </div>
                <div>
                  <Text strong>功能内角色说明</Text>
                  <TextArea
                    value={draft.roleDescription}
                    disabled={Boolean(busy)}
                    autoSize={{ minRows: 3, maxRows: 8 }}
                    onChange={(event) => updateDraft('roleDescription', event.target.value)}
                    placeholder="填写该技术落脚点在车辆功能中的实际角色；留空会保存为 NULL。"
                    style={{ marginTop: 5 }}
                  />
                </div>
                {formIssues.length > 0 ? (
                  <Alert type="error" showIcon title="请先修正以下内容" description={formIssues.map((issue) => <div key={issue}>{issue}</div>)} />
                ) : null}
                {formError ? <Alert type="error" showIcon title="服务端未接受落脚点修改" description={formError} /> : null}
                <Space wrap>
                  <Button type="primary" loading={busy === 'landing-point'} disabled={Boolean(busy)} onClick={() => void saveLandingPoint()}>
                    {mode === 'create' ? '创建落脚点' : '保存修改'}
                  </Button>
                  <Button disabled={Boolean(busy)} onClick={cancelDetails}>取消</Button>
                </Space>
              </Space>
            )}
          </Card>
        ) : null}

        {activeLandingPointId ? (
          <Card
            size="small"
            title="部署标准九宫格"
            extra={<Text type="secondary">服务端已保存 {standardCells.length} / 9 格</Text>}
          >
            <Space orientation="vertical" size={10} style={{ width: '100%' }}>
              <Text type="secondary">缺少服务端记录表示“尚未填写”；NULL 表示“明确留空”。系统不会替空格生成标准正文，只会保存你明确提交的格子。</Text>
              {cellEditingKey ? <Alert type="info" showIcon title="当前标准格有未保存修改；请先保存或取消，再切换到其他格子。" /> : null}
              {standardsQuery.isError ? (
                <Alert
                  type="error"
                  showIcon
                  title="部署标准加载失败"
                  description={errorMessage(standardsQuery.error)}
                  action={<Button size="small" onClick={() => void standardsQuery.refetch()}>重试</Button>}
                />
              ) : null}
              {standardsQuery.isLoading && !standardsQuery.data ? <Spin description="正在加载部署标准" /> : null}
              {standardError ? <Alert type="error" showIcon title="标准格保存失败" description={standardError} /> : null}
              {cellConflict ? (
                <Alert
                  type="warning"
                  showIcon
                  title="检测到并发修改，已阻止覆盖"
                  description={(
                    <Space orientation="vertical" size={6}>
                      <Text>
                        服务端当前内容：{!cellConflict.latest
                          ? '尚未填写'
                          : cellConflict.latest.requirement_text === null
                            ? '明确留空（NULL）'
                            : cellConflict.latest.requirement_text || '有文本（空字符串）'}
                      </Text>
                      <Space wrap>
                        <Button size="small" disabled={Boolean(busy)} onClick={loadLatestCell}>载入最新值</Button>
                        <Button
                          size="small"
                          danger
                          disabled={Boolean(busy)}
                          onClick={() => void saveStandardCell(
                            cellConflict.phase,
                            cellConflict.constraintType,
                            cellConflict.attemptedValue,
                            true,
                          )}
                        >
                          {cellConflict.attemptedValue === null ? '仍确认留空' : '仍覆盖为我的文本'}
                        </Button>
                      </Space>
                    </Space>
                  )}
                />
              ) : null}
              {standardsQuery.isSuccess ? (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(88px, 0.6fr) repeat(3, minmax(210px, 1fr))', gap: 8, minWidth: 760 }}>
                    <div aria-hidden="true" />
                    {CONSTRAINTS.map((constraintType) => (
                      <Text key={constraintType} strong style={{ padding: '8px 10px' }}>{constraintType}</Text>
                    ))}
                    {PHASES.map((phase) => (
                      <Fragment key={phase}>
                        <Text strong style={{ padding: '12px 8px' }}>{phase}</Text>
                        {CONSTRAINTS.map((constraintType) => {
                          const cell = findStandard(standardCells, phase, constraintType)
                          const cellKey = standardCellKey(phase, constraintType)
                          const status = persistedState(cell)
                          const isEditing = cellEditingKey === cellKey
                          return (
                            <Card key={cellKey} size="small" title={<Space wrap><Text strong>{constraintType}</Text><Tag color={status.color}>{status.label}</Tag></Space>}>
                              {isEditing ? (
                                <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                                  <Input.TextArea
                                    value={cellTextDraft}
                                    disabled={Boolean(busy)}
                                    autoSize={{ minRows: 3, maxRows: 8 }}
                                    onChange={(event) => setCellTextDraft(event.target.value)}
                                    placeholder="填写经人工确认的部署边界；不自动生成内容。"
                                  />
                                  <Space wrap>
                                    <Button
                                      type="primary"
                                      size="small"
                                      loading={busy === 'standard'}
                                      disabled={Boolean(busy) || !cellTextDraft.trim()}
                                      onClick={() => void saveStandardCell(phase, constraintType, cellTextDraft)}
                                    >
                                      保存文本
                                    </Button>
                                    <Button
                                      size="small"
                                      loading={busy === 'standard'}
                                      disabled={Boolean(busy)}
                                      onClick={() => void saveStandardCell(phase, constraintType, null)}
                                    >
                                      确认留空
                                    </Button>
                                    <Button size="small" disabled={Boolean(busy)} onClick={closeCellEditor}>取消</Button>
                                  </Space>
                                </Space>
                              ) : (
                                <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                                  {cell === null ? (
                                    <Text type="secondary">尚未填写；该格没有服务端记录。</Text>
                                  ) : cell.requirement_text === null ? (
                                    <Text type="secondary">已明确留空；服务端保存的 requirement_text 为 NULL。</Text>
                                  ) : (
                                    <Text style={{ whiteSpace: 'pre-wrap' }}>{cell.requirement_text || '有文本（空字符串）'}</Text>
                                  )}
                                  <Button size="small" disabled={Boolean(busy) || detailsDirty || Boolean(cellEditingKey)} onClick={() => openCellEditor(phase, constraintType)}>
                                    {cell ? '编辑此格' : '填写此格'}
                                  </Button>
                                </Space>
                              )}
                            </Card>
                          )
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              ) : null}
            </Space>
          </Card>
        ) : null}
      </Space>
    </Card>
  )
}
