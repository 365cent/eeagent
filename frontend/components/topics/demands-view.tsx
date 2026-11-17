'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App as AntApp, Button, Card, Modal, Select, Space, Table, Tag, Typography } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { deleteDemand, fetchDemands, fetchLandingPoints, fetchVehicleFunctions, patchDemand } from '@/lib/api/eea-api'
import { eeaErrorMessage } from '@/lib/api/client'
import { eeaQueryKeys, useRefCodeMaps, useThemeRows } from '@/hooks/use-eea-queries'
import { labelFor, shortStageLabel } from '@/lib/eea-mappers'
import type { DemandOut, LandingPointOut, VehicleFunctionOut } from '@/lib/api/types'

const { Text } = Typography

function statusLabel(status: string | null): string {
  if (status === 'confirmed') return '已确认'
  if (status === 'pending') return '待复核'
  return status || '—'
}

function stageLabel(maps: ReturnType<typeof useRefCodeMaps>['maps'], code: string | null | undefined): string {
  if (!code) return '—'
  return shortStageLabel(labelFor(maps, 'value_chain_stage', code))
}

function readCrossValidation(value: Record<string, unknown> | null) {
  if (!value) return null
  const conclusion = typeof value.conclusion === 'string' ? value.conclusion : ''
  const detail = typeof value.detail === 'string' ? value.detail : ''
  const perspectives = Array.isArray(value.perspectives)
    ? value.perspectives.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
  if (!conclusion && !detail && perspectives.length === 0) return null
  return { conclusion, detail, perspectives }
}

function DemandMappingPanel({
  demand,
  functions,
  functionsLoading,
  functionsError,
  landings,
  landingsLoading,
  maps,
}: {
  demand: DemandOut
  functions: VehicleFunctionOut[]
  functionsLoading: boolean
  functionsError: boolean
  landings: LandingPointOut[]
  landingsLoading: boolean
  maps: ReturnType<typeof useRefCodeMaps>['maps']
}) {
  const cross = readCrossValidation(demand.cross_validation)
  const landingsByFunction = useMemo(() => {
    const grouped = new Map<string, LandingPointOut[]>()
    for (const point of landings) {
      const list = grouped.get(point.vehicle_function_id) ?? []
      list.push(point)
      grouped.set(point.vehicle_function_id, list)
    }
    return grouped
  }, [landings])

  return (
    <div className="theme-detail-expand-panel">
      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
        <Space wrap size={16}>
          <Text>价值链：{stageLabel(maps, demand.value_chain_stage_code)}</Text>
          <Text>信号频次：{demand.signal_frequency ?? 0}</Text>
          <Text>来源数：{demand.source_count ?? 0}</Text>
          <Text>交叉验证：{cross?.conclusion || '未记录'}</Text>
        </Space>
        {cross?.detail ? <Text type="secondary">{cross.detail}</Text> : null}
        {cross?.perspectives.length ? (
          <Space wrap size={4}>
            {cross.perspectives.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </Space>
        ) : null}
        <Table<VehicleFunctionOut>
          className="theme-detail-nested-table"
          size="small"
          rowKey="id"
          pagination={false}
          tableLayout="fixed"
          loading={functionsLoading}
          dataSource={functions}
          locale={{
            emptyText: functionsError ? (
              <Text type="danger">车辆功能加载失败</Text>
            ) : (
              <Text type="secondary">该需求点尚未映射车辆功能</Text>
            ),
          }}
          columns={[
            { title: '车辆功能', dataIndex: 'name', ellipsis: true },
            {
              title: '状态',
              dataIndex: 'published',
              width: 88,
              render: (published: boolean) => (
                <Tag color={published ? 'success' : 'default'}>{published ? '已发布' : '草稿'}</Tag>
              ),
            },
            {
              title: '价值链',
              width: 96,
              render: (_value, record) => stageLabel(maps, record.value_chain_stage_code),
            },
            {
              title: '技术落脚点',
              render: (_value, record) => {
                const points = landingsByFunction.get(record.id) ?? []
                if (landingsLoading) return <Text type="secondary">加载中</Text>
                if (points.length === 0) return '—'
                return (
                  <Space wrap size={[4, 4]}>
                    {points.map((point) => (
                      <Tag key={point.id} color="blue">
                        {point.domain_name ? `${point.domain_name} · ` : ''}
                        {point.name}
                        {typeof point.standard_count === 'number' ? ` · ${point.standard_count} 项标准` : ''}
                      </Tag>
                    ))}
                  </Space>
                )
              },
            },
          ]}
        />
      </Space>
    </div>
  )
}

export function DemandsView({
  focusDemandId,
  sourceThemeId,
}: {
  focusDemandId?: string
  sourceThemeId?: string
}) {
  const { message: messageApi, modal: modalApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const { maps } = useRefCodeMaps()
  const { data: themes } = useThemeRows()
  const demandsQuery = useQuery({ queryKey: eeaQueryKeys.demands, queryFn: fetchDemands })
  const functionsQuery = useQuery({
    queryKey: eeaQueryKeys.vehicleFunctions(null),
    queryFn: () => fetchVehicleFunctions(),
  })
  const landingsQuery = useQuery({
    queryKey: eeaQueryKeys.landingPoints,
    queryFn: () => fetchLandingPoints(),
  })
  const [moving, setMoving] = useState<DemandOut | null>(null)
  const [nextThemeId, setNextThemeId] = useState<string | undefined>()
  const [openDemandId, setOpenDemandId] = useState<string | null | undefined>(undefined)

  const themeName = useMemo(() => {
    const names = new Map<string, string>()
    for (const theme of themes ?? []) names.set(theme.id, theme.working_name)
    return names
  }, [themes])

  const rows = useMemo(() => {
    const all = demandsQuery.data ?? []
    if (!sourceThemeId) return all
    const linked = all.filter((demand) => demand.source_tech_theme_id === sourceThemeId)
    return linked.length > 0 ? linked : all
  }, [demandsQuery.data, sourceThemeId])

  const functionsByDemand = useMemo(() => {
    const grouped = new Map<string, VehicleFunctionOut[]>()
    for (const vehicleFunction of functionsQuery.data ?? []) {
      const list = grouped.get(vehicleFunction.demand_point_id) ?? []
      list.push(vehicleFunction)
      grouped.set(vehicleFunction.demand_point_id, list)
    }
    return grouped
  }, [functionsQuery.data])

  const expandedKey =
    openDemandId === undefined
      ? rows.some((row) => row.id === focusDemandId)
        ? focusDemandId
        : rows.length === 1
          ? rows[0].id
          : null
      : openDemandId

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.demands })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.vehicleFunctionsRoot })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.landingPoints })
  }

  const moveMutation = useMutation({
    mutationFn: () => {
      if (!moving || !nextThemeId) throw new Error('no theme')
      return patchDemand(moving.id, { source_tech_theme_id: nextThemeId })
    },
    onSuccess: async () => {
      await refresh()
      messageApi.success('来源主题已更新')
      setMoving(null)
    },
    onError: (err) => {
      messageApi.error(eeaErrorMessage(err, '保存失败'))
    },
  })

  const confirmDelete = (demand: DemandOut) => {
    const mapped = functionsByDemand.get(demand.id) ?? []
    const functionCount = functionsQuery.isSuccess ? mapped.length : (demand.function_count ?? 0)
    const names = mapped.map((item) => item.name).join('、')
    modalApi.confirm({
      title: '删除需求点',
      content:
        functionCount > 0
          ? names
            ? `删除「${demand.name}」会同时去掉已映射的「${names}」。来源主题会保留。`
            : `删除「${demand.name}」会同时去掉已映射的 ${functionCount} 个车辆功能。来源主题会保留。`
          : `删除「${demand.name}」后，来源主题不再被这个需求点引用。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteDemand(demand.id)
          await refresh()
          messageApi.success('需求点已删除')
        } catch (err) {
          messageApi.error(eeaErrorMessage(err, '删除失败'))
        }
      },
    })
  }

  const themeOptions = (themes ?? [])
    .filter((theme) => theme.id !== moving?.source_tech_theme_id)
    .map((theme) => ({ value: theme.id, label: theme.working_name }))

  return (
    <>
      <Card
        className="panel-card view-card theme-detail-table-card"
        title="需求点"
        extra={<Text type="secondary">展开查看交叉验证、车辆功能与技术落脚点</Text>}
      >
        <Table<DemandOut>
          className="theme-detail-table"
          rowKey="id"
          pagination={false}
          tableLayout="fixed"
          scroll={{ x: 1080 }}
          loading={demandsQuery.isLoading}
          dataSource={rows}
          rowClassName={(row) => (row.id === focusDemandId ? 'topic-row-anchor' : '')}
          locale={{
            emptyText: (
              <PlatformEmptyState
                title="暂无需求点"
                description="主题被需求点引用时，删除主题前需要先处理这里的记录。"
              />
            ),
          }}
          expandable={{
            columnWidth: 48,
            expandedRowClassName: () => 'theme-detail-expanded-row',
            expandedRowKeys: expandedKey ? [expandedKey] : [],
            onExpand: (expanded, record) => setOpenDemandId(expanded ? record.id : null),
            expandedRowRender: (record) => (
              <DemandMappingPanel
                demand={record}
                functions={functionsByDemand.get(record.id) ?? []}
                functionsLoading={functionsQuery.isLoading}
                functionsError={functionsQuery.isError}
                landings={(landingsQuery.data ?? []).filter((point) =>
                  (functionsByDemand.get(record.id) ?? []).some((item) => item.id === point.vehicle_function_id),
                )}
                landingsLoading={landingsQuery.isLoading}
                maps={maps}
              />
            ),
          }}
          columns={[
            { title: '需求点', dataIndex: 'name', width: 200, ellipsis: true },
            {
              title: '来源主题',
              dataIndex: 'source_tech_theme_id',
              width: 200,
              ellipsis: true,
              render: (themeId: string | null) => (themeId ? themeName.get(themeId) ?? '—' : '—'),
            },
            {
              title: '价值链',
              dataIndex: 'value_chain_stage_code',
              width: 96,
              render: (code: string | null) => stageLabel(maps, code),
            },
            {
              title: '车辆功能',
              width: 220,
              render: (_value, record) => {
                if (functionsQuery.isLoading) return <Text type="secondary">加载中</Text>
                if (functionsQuery.isError) return <Text type="danger">加载失败</Text>
                const mapped = functionsByDemand.get(record.id) ?? []
                if (mapped.length === 0) return '—'
                return (
                  <Space wrap size={[4, 4]}>
                    {mapped.map((item) => (
                      <Tag key={item.id} color={item.published ? 'success' : 'default'}>
                        {item.name}
                      </Tag>
                    ))}
                  </Space>
                )
              },
            },
            {
              title: '复核',
              dataIndex: 'review_status',
              width: 100,
              render: (status: string | null) => (
                <Tag color={status === 'confirmed' ? 'success' : 'warning'}>{statusLabel(status)}</Tag>
              ),
            },
            {
              title: '操作',
              width: 180,
              render: (_value, record) => (
                <Space className="theme-detail-actions" size={0}>
                  <Button
                    type="link"
                    onClick={() => {
                      setMoving(record)
                      setNextThemeId(undefined)
                    }}
                  >
                    改来源
                  </Button>
                  <Button type="link" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)}>
                    删除
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        title="改来源主题"
        open={moving !== null}
        destroyOnHidden
        okText="保存"
        cancelText="取消"
        confirmLoading={moveMutation.isPending}
        okButtonProps={{ disabled: !nextThemeId }}
        onCancel={() => setMoving(null)}
        onOk={() => moveMutation.mutate()}
      >
        <Select
          showSearch={{ optionFilterProp: 'label' }}
          style={{ width: '100%' }}
          placeholder="选择新的来源主题"
          value={nextThemeId}
          options={themeOptions}
          onChange={(value) => setNextThemeId(value)}
        />
      </Modal>
    </>
  )
}
