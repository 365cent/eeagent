'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertOutlined,
  ApartmentOutlined,
  AudioOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  BellOutlined,
  BranchesOutlined,
  BookOutlined,
  BulbOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloudDownloadOutlined,
  FileTextOutlined,
  FundOutlined,
  DownOutlined,
  FileSearchOutlined,
  FilePdfOutlined,
  FileAddOutlined,
  FilterOutlined,
  FundProjectionScreenOutlined,
  HomeOutlined,
  LinkOutlined,
  PictureOutlined,
  QuestionCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoreOutlined,
  MoonOutlined,
  SunOutlined,
  PlusOutlined,
  RadarChartOutlined,
  ReadOutlined,
  SearchOutlined,
  SettingOutlined,
  TagsOutlined,
  TableOutlined,
  ToolOutlined,
  UserOutlined,
  VideoCameraOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { App as AntApp, Alert, Button, Card, Checkbox, Col, Divider, Dropdown, Input, Progress, Row, Segmented, Select, Space, Spin, Statistic, Table, Tag, Tooltip, Typography, Upload, Timeline } from 'antd'
import { Drawer as VaulDrawer } from 'vaul'
import { ProCard } from '@ant-design/pro-components'
import type { ColumnsType } from 'antd/es/table'
import { PlatformLayout } from '@/components/layout/platform-layout'
import { PageHeader } from '@/components/shared/page-header'
import { mainMenuItems } from '@/config/menu'
import { utilityPages } from '@/config/utility-pages'
import { ALL_VIEW_KEYS } from '@/config/routes'
import {
  useDemandRows,
  useLandingRows,
  useOverviewStats,
  usePanoramaStages,
  useSignalDetail,
  useTraceChain,
  useSignalsListFiltered,
  useThemeRows,
  useRefCodeMaps,
  eeaQueryKeys,
} from '@/hooks/use-eea-queries'
import { overviewToTraceMetrics, formatApiDate } from '@/lib/eea-mappers'
import { setLivePlatformSearchData } from '@/lib/live-platform-data'
import { resetPlatformSearchIndex } from '@/lib/platform-search-index'
import { isUuid } from '@/lib/api/api-errors'
import { EeaApiError, signalArchiveUrl, documentCanonicalUrl } from '@/lib/api/client'
import { fetchLandingPoints } from '@/lib/api/eea-api'
import { buildAppPath } from '@/lib/navigation'
import { sourceExcerptSnippet } from '@/lib/evidence/audio-overview-segments'
import type { AppRouteOptions, NavigateFn, Signal } from '@/types/platform'
import type { StudioInfographicPayload, StudioMindmapPayload } from '@/lib/api/types'
import type { MenuProps } from 'antd'
import { EvidenceAssistantChat } from '@/components/evidence/evidence-assistant-chat'
import { EvidenceAudioTransport } from '@/components/evidence/evidence-audio-transport'
import { EvidenceStudioPane } from '@/components/evidence/evidence-studio-pane'
import { SignalBodyMarkdown } from '@/components/evidence/signal-body-markdown'
import { SignalTagsEditor } from '@/components/evidence/signal-tags-editor'
import { SignalClassificationEditor } from '@/components/evidence/signal-classification-editor'
import { SignalCorrectionAudit } from '@/components/evidence/signal-correction-audit'
import { SignalThemeAssign } from '@/components/evidence/signal-theme-assign'
import { TopicsView } from '@/components/topics/topics-view'
import { CreateTopicForm } from '@/components/topics/create-topic-form'
import { VocabKnowledgePanel } from '@/components/topics/vocab-knowledge-panel'
import { FunctionDerivationEditor } from '@/components/technology/function-derivation-editor'
import { LandingPointWorkbench } from '@/components/technology/landing-point-workbench'
import { StrategyFunnelWorkbench } from '@/components/strategy/strategy-funnel-workbench'
import { PlatformEmptyState, signalsTableLocale } from '@/components/shared/empty-state'
import { NewSignalImportPage } from '@/components/import/new-signal-import'
import { WorkflowStudio } from '@/components/workflow-studio'
import { PlatformSettingsPage } from '@/views/utility/platform-settings-page'
import { ProfilePage } from '@/views/utility/profile-page'

const { Text, Title, Paragraph } = Typography

const statusColors: Record<string, string> = {
  已留存: 'success',
  待人工复核: 'warning',
  抓取中: 'processing',
  抓取失败: 'error',
}

function QueryFailure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Space orientation="vertical" size={8}>
      <Text type="danger">{message}</Text>
      <Button size="small" onClick={onRetry}>重试</Button>
    </Space>
  )
}

function SignalQuickPreviewDrawer({
  signal,
  onClose,
  onOpenFull,
}: {
  signal: Signal | null
  onClose: () => void
  onOpenFull: (signalKey: string) => void
}) {
  return (
    <VaulDrawer.Root open={Boolean(signal)} onOpenChange={(open) => !open && onClose()} direction="right">
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="signal-drawer-overlay" />
        <VaulDrawer.Content className="signal-drawer-content">
          <VaulDrawer.Title className="signal-drawer-title">{signal?.title ?? '原始证据'}</VaulDrawer.Title>
          <VaulDrawer.Description className="signal-drawer-description">
            {signal?.publisher} · {signal?.channel}
          </VaulDrawer.Description>
          {signal ? (
            <div className="signal-drawer-body">
              <Space wrap>
                <Tag color="cyan">{signal.stage}</Tag>
                <Tag color="purple">{signal.type}</Tag>
                <Tag color={statusColors[signal.status]}>{signal.status}</Tag>
              </Space>
              <Divider />
              <Paragraph>
                {signal.title}：该证据已完成来源留存与机器预标，可继续查看上下文、关联主题和需求点。
              </Paragraph>
              <Button type="primary" block onClick={() => onOpenFull(signal.key)}>
                打开完整证据
              </Button>
            </div>
          ) : null}
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  )
}

export function SignalRowActions({
  record,
  onNavigate,
  onQuickPreview,
}: {
  record: Signal
  onNavigate: (target: string) => void
  onQuickPreview?: (signal: Signal) => void
}) {
  const { message: messageApi } = AntApp.useApp()

  const items: MenuProps['items'] = [
    { key: 'view', label: '查看证据', icon: <FileSearchOutlined /> },
    ...(onQuickPreview ? [{ key: 'preview', label: '快速预览', icon: <ReadOutlined /> }] : []),
    { key: 'topic', label: '加入主题', icon: <TagsOutlined /> },
    { key: 'trace', label: '查看推导链', icon: <FundProjectionScreenOutlined /> },
    ...(record.status === '待人工复核'
      ? [{ key: 'review', label: '开始人工复核', icon: <CheckCircleFilled /> }]
      : []),
    { type: 'divider' },
    { key: 'copy', label: '复制信号链接', icon: <LinkOutlined /> },
    { key: 'archive', label: '归档停用', icon: <AlertOutlined />, danger: true },
  ]

  const onMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation()
    switch (key) {
      case 'view':
        onNavigate(`singal/${record.key}`)
        break
      case 'preview':
        onQuickPreview?.(record)
        break
      case 'topic':
        onNavigate(`singal/${record.key}`)
        break
      case 'trace':
        onNavigate('traceDetail')
        break
      case 'review':
        onNavigate(`singal/${record.key}`)
        break
      case 'copy': {
        const link = `${window.location.origin}${buildAppPath({ view: 'singal', id: record.key })}`
        void navigator.clipboard.writeText(link).then(
          () => messageApi.success('信号链接已复制'),
          () => messageApi.error('复制失败，请手动复制链接'),
        )
        break
      }
      case 'archive':
        messageApi.warning('当前没有可用的信号归档接口，尚未修改数据。')
        break
      default:
        break
    }
  }

  return (
    <Dropdown menu={{ items, onClick: onMenuClick }} trigger={['click']} placement="bottomRight">
      <Button
        type="text"
        icon={<MoreOutlined />}
        aria-label="更多操作"
        onClick={(event) => event.stopPropagation()}
      />
    </Dropdown>
  )
}

function buildSignalTableColumns({
  onNavigate,
  onTitleClick,
  onQuickPreview,
}: {
  onNavigate: (target: string) => void
  onTitleClick: (signal: Signal) => void
  onQuickPreview?: (signal: Signal) => void
}): ColumnsType<Signal> {
  return [
    {
      title: '信号标题',
      dataIndex: 'title',
      render: (value: string, record) => (
        <button type="button" className="signal-title signal-title-button" onClick={() => onTitleClick(record)}>
          <span className="signal-dot" />
          <span>
            <Text strong>{value}</Text>
            <span className="signal-meta">{record.publisher} · {record.channel}</span>
          </span>
        </button>
      ),
    },
    { title: '价值链环节', dataIndex: 'stage', render: (value: string) => <Tag className="stage-tag">{value}</Tag> },
    { title: '类型', dataIndex: 'type' },
    {
      title: '技术方向',
      dataIndex: 'tags',
      render: (values: string[]) => (
        <Space wrap>{values.map((tag) => <Tag key={tag} className="tech-tag">{tag}</Tag>)}</Space>
      ),
    },
    { title: '证据状态', dataIndex: 'status', render: (value: string) => <Tag color={statusColors[value]}>{value}</Tag> },
    { title: '更新时间', dataIndex: 'date' },
    {
      key: 'action',
      width: 44,
      render: (_value: unknown, record: Signal) => (
        <SignalRowActions record={record} onNavigate={onNavigate} onQuickPreview={onQuickPreview} />
      ),
    },
  ]
}

export function SignalsView({
  query,
  setQuery,
  themeId,
  onClearTheme,
  onNavigate,
  onPreviewSignal,
}: {
  query: string
  setQuery: (value: string) => void
  themeId?: string
  onClearTheme?: () => void
  onNavigate: (key: string) => void
  onPreviewSignal: (signal: Signal | null) => void
}) {
  const [stage, setStage] = useState('全部环节')
  const { rows: signalRows, isLoading, isError, refetch } = useSignalsListFiltered({ query, stageChip: stage, themeId })
  const refCodeQuery = useRefCodeMaps()
  const overviewQuery = useOverviewStats()
  const overviewReady = overviewQuery.isSuccess
  const overview = overviewQuery.data
  const columns = buildSignalTableColumns({
    onNavigate,
    onTitleClick: onPreviewSignal,
    onQuickPreview: onPreviewSignal,
  })
  return (
    <>
      <PageHeader eyebrow="01 · 原始信息采集" title="信号与证据库" description="收集产业信号，留存可追溯证据，并通过封闭词表完成机器预标。" action={<Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('newSignal')}>粘贴 URL 抓取</Button>} />
      {themeId ? <Alert type="info" showIcon style={{ marginBottom: 16 }} title="正在查看该主题下的信号" action={<Button size="small" onClick={onClearTheme}>清除主题筛选</Button>} /> : null}
      {overviewQuery.isError ? <QueryFailure message="信号统计加载失败，请检查服务连接后重试。" onRetry={() => { void overviewQuery.refetch() }} /> : null}
      <Row gutter={16} className="summary-row">
        <Col span={6}><Card><Statistic title="全部信号" value={overviewReady ? overview?.signals ?? 0 : '—'} /></Card></Col>
        <Col span={6}><Card><Statistic title={<Tooltip title="按非空 url_normalized 去重，包含已归档信号。">去重来源数</Tooltip>} value={overviewReady ? overview?.signal_sources ?? '—' : '—'} /></Card></Col>
        <Col span={6}><Card><Statistic title="已留存" value={overviewReady ? overview?.signals_retained ?? '—' : '—'} styles={{ content: { color: '#16a34a' } }} /></Card></Col>
        <Col span={6}><Card><Statistic title="待人工复核" value={overviewReady ? overview?.signals_pending_review ?? 0 : '—'} styles={{ content: { color: '#d97706' } }} /></Card></Col>
      </Row>
      <Card className="panel-card view-card" title="证据列表" extra={<Space wrap><Input allowClear prefix={<SearchOutlined />} placeholder="搜索标题、发布主体或标签" value={query} onChange={(e) => setQuery(e.target.value)} /><Select value={stage} onChange={setStage} options={['全部环节', '创造端', '传递端', '兑现端', '规制端'].map((value) => ({ label: value, value }))} /></Space>}>
        {isError || refCodeQuery.isError ? (
          <QueryFailure message="信号列表加载失败，请检查服务连接后重试。" onRetry={() => { void (refCodeQuery.isError ? refCodeQuery.refetch() : refetch()) }} />
        ) : !refCodeQuery.isSuccess || isLoading ? (
          <Spin />
        ) : (
          <Table rowKey="key" columns={columns} dataSource={signalRows} pagination={{ pageSize: 6 }} scroll={{ x: 960 }} locale={signalsTableLocale(() => onNavigate('newSignal'))} />
        )}
      </Card>
    </>
  )
}



export function TraceView({ onNavigate }: { onNavigate: NavigateFn }) {
  const panoramaQuery = usePanoramaStages()
  const stages = panoramaQuery.data ?? []
  const relationships = stages.flatMap((stage) =>
    stage.demand_points.flatMap((demand) =>
      demand.functions.flatMap((vehicleFunction) =>
        vehicleFunction.landing_points.map((landingPoint) => ({
          key: `${stage.stage_code}-${demand.id}-${vehicleFunction.id}-${landingPoint.id}`,
          stage: stage.stage_label,
          demand: demand.name,
          vehicleFunction: vehicleFunction.name,
          landingPoint: landingPoint.name,
        landingPointId: landingPoint.id,
          domain: landingPoint.domain_name,
        })),
      ),
    ),
  )

  return (
    <>
      <PageHeader eyebrow="03 · 需求与功能映射" title="链路追溯" description="查看服务端已保存的需求、车辆功能与技术落脚点关系。" />
      {panoramaQuery.isError ? (
        <QueryFailure message="链路数据加载失败，请检查服务连接后重试。" onRetry={() => { void panoramaQuery.refetch() }} />
      ) : panoramaQuery.isLoading ? (
        <Spin />
      ) : relationships.length === 0 ? (
        <PlatformEmptyState title="暂无可追溯链路" description="保存真实需求、车辆功能和技术落脚点关系后，链路将在此显示。" />
      ) : (
        <Card className="panel-card view-card" title="已保存的推导关系">
          <Table
            rowKey="key"
            dataSource={relationships}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: '价值链环节', dataIndex: 'stage' },
              { title: '需求点', dataIndex: 'demand' },
              { title: '车辆功能', dataIndex: 'vehicleFunction' },
              { title: '技术落脚点', dataIndex: 'landingPoint' },
              { title: '技术域', dataIndex: 'domain' },
              {
                title: '操作',
                key: 'action',
                render: (_value: unknown, record: (typeof relationships)[number]) => (
                  <Button type="link" onClick={() => onNavigate(`traceDetail/${record.landingPointId}`)}>
                    查看完整链路
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}
    </>
  )
}

export function TechnologyView() {
  const panoramaQuery = usePanoramaStages()
  const landingDetailsQuery = useQuery({
    queryKey: eeaQueryKeys.landingPoints,
    queryFn: () => fetchLandingPoints(),
  })
  const stages = panoramaQuery.data ?? []
  const landingDetailsById = new Map((landingDetailsQuery.data ?? []).map((point) => [point.id, point]))
  const hasPanoramaRecords = stages.some((stage) =>
    stage.demand_count > 0 || stage.landing_point_count > 0 || stage.demand_points.length > 0,
  )

  return (
    <>
      <PageHeader eyebrow="04 · 功能与技术拆解" title="技术全景图" description="按价值链环节展开需求点、车辆功能与技术落脚点，建立技术地图。" />
      <FunctionDerivationEditor />
      <LandingPointWorkbench />
      {landingDetailsQuery.isError ? (
        <QueryFailure message="落脚点角色说明加载失败，请检查服务连接后重试。" onRetry={() => { void landingDetailsQuery.refetch() }} />
      ) : null}
      {panoramaQuery.isError ? (
        <QueryFailure message="技术全景加载失败，请检查服务连接后重试。" onRetry={() => { void panoramaQuery.refetch() }} />
      ) : panoramaQuery.isLoading ? (
        <Spin />
      ) : !hasPanoramaRecords ? (
        <PlatformEmptyState title="暂无技术落脚点" description="需求与车辆功能形成有效推导并保存落脚点后，将在此显示真实技术全景。" />
      ) : (
        <div className="panorama-grid">
          {stages.map((stage) => {
            const landingPointRows = stage.demand_points.flatMap((demand) =>
              demand.functions.flatMap((vehicleFunction) =>
                vehicleFunction.landing_points.map((landingPoint) => ({
                  ...landingPoint,
                  demandName: demand.name,
                  functionName: vehicleFunction.name,
                  roleDescription: landingDetailsById.get(landingPoint.id)?.role_description ?? null,
                })),
              ),
            )

            return (
              <Card
                className="panel-card panorama-column"
                key={stage.stage_code}
                title={<span><span className="stage-marker" />{stage.stage_label}</span>}
                extra={<Tag>{stage.demand_count} 个需求</Tag>}
              >
                {landingPointRows.length ? landingPointRows.map((item) => (
                  <div className="landing-card" key={item.id}>
                    <div className="landing-head"><Text strong>{item.name}</Text><Tag color="blue">{item.domain_name}</Tag></div>
                    <Text type="secondary">需求：{item.demandName}</Text>
                    <Text type="secondary">车辆功能：{item.functionName}</Text>
                    <Text type="secondary">功能内角色：{landingDetailsQuery.isSuccess ? item.roleDescription || '未填写' : '正在加载中'}</Text>
                    <div className="landing-footer"><span>{item.standard_count} 个部署标准</span></div>
                  </div>
                )) : <Text type="secondary">该环节暂无技术落脚点。</Text>}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

export function StrategyView() {
  return <StrategyFunnelWorkbench />
}

function DeductionChainWorkspace({ onNavigate, initialLandingPointId }: { onNavigate: NavigateFn; initialLandingPointId?: string }) {
  const [landingPointId, setLandingPointId] = useState<string | undefined>(initialLandingPointId)
  const landingQuery = useLandingRows()
  const traceQuery = useTraceChain(landingPointId)
  const trace = traceQuery.data
  useEffect(() => {
    setLandingPointId(initialLandingPointId || undefined)
  }, [initialLandingPointId])
  const standardPhases = ['设计', '制造', '运营'] as const
  const standardConstraints = ['工程化', '经济性', '安全合规'] as const
  const stageNames: Record<string, string> = {
    landing_point: '技术落脚点',
    vehicle_function: '车辆功能',
    demand_point: '需求点',
    theme: '技术主题',
    signals: '原始信号',
  }
  const forwardSteps = Array.isArray(trace?.vehicle_function?.forward_trace?.steps)
    ? trace.vehicle_function.forward_trace.steps
    : []
  const demandSteps = trace?.demand_point?.derivation_trace?.steps ?? []

  return (
    <div className="deduction-workspace">
      <Card className="panel-card" title="选择技术落脚点">
        {landingQuery.isError ? (
          <QueryFailure message="技术落脚点加载失败，请检查服务连接后重试。" onRetry={() => { void landingQuery.refetch() }} />
        ) : (
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            loading={landingQuery.isLoading}
            value={landingPointId}
            onChange={(value) => {
              setLandingPointId(value)
              onNavigate(value ? `traceDetail/${value}` : 'traceDetail')
            }}
            placeholder="选择已保存的技术落脚点以查看来源链路"
            options={landingQuery.rows.map((row) => ({ value: row.key, label: row.name }))}
            style={{ width: '100%' }}
          />
        )}
      </Card>
      {traceQuery.isError ? (
        traceQuery.error instanceof EeaApiError && [404, 422].includes(traceQuery.error.status) ? (
          <Alert
            type="warning"
            showIcon
            title="无法打开这条追溯链"
            description={traceQuery.error.status === 404 ? '该技术落脚点已不存在，可能是链接过期或记录已删除。' : '追溯链接中的技术落脚点编号无效。'}
            action={<Button size="small" onClick={() => onNavigate('traceDetail')}>重新选择落脚点</Button>}
          />
        ) : (
          <QueryFailure message="推导链加载失败，请检查服务连接后重试。" onRetry={() => { void traceQuery.refetch() }} />
        )
      ) : traceQuery.isLoading ? (
        <Spin />
      ) : trace ? (
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          {!trace.completeness.complete ? (
            <Alert
              type="warning"
              showIcon
              title="推导链存在缺失或失效引用"
              description={[
                trace.completeness.missing_stages.length
                  ? `缺少环节：${trace.completeness.missing_stages.map((stage) => stageNames[stage] ?? stage).join('、')}`
                  : '',
                trace.completeness.unresolved_evidence_signal_ids.length
                  ? `无法解析的信号引用：${trace.completeness.unresolved_evidence_signal_ids.join('、')}`
                  : '',
                trace.completeness.unresolved_document_ids.length
                  ? `无法解析的文档引用：${trace.completeness.unresolved_document_ids.join('、')}`
                  : '',
              ].filter(Boolean).join('；')}
            />
          ) : (
            <Alert type="success" showIcon title="当前链路的结构化关联完整。来源文件与图片对象仍需按各自链接核验。" />
          )}

          <Card className="panel-card" title="当前推导关系">
            <Space wrap>
              <Tag color="blue">技术域：{trace.landing_point.domain_name ?? '未关联'}</Tag>
              <Tag color={trace.function_published ? 'green' : 'orange'}>
                功能：{trace.vehicle_function?.name ?? '未关联'} · {trace.function_published ? '已发布' : trace.vehicle_function ? '未发布' : '未关联'}
              </Tag>
              <Tag color={trace.demand_review_status === 'confirmed' ? 'green' : 'orange'}>
                需求复核：{trace.demand_review_status ?? '无记录'}
              </Tag>
              <Tag>交叉验证：{trace.demand_cross_validation_conclusion ?? '无记录'}</Tag>
              <Tag>战略版本：{trace.assessment_versions.length}</Tag>
            </Space>
            <Row gutter={[18, 18]} style={{ marginTop: 16 }}>
              <Col xs={24} sm={12} lg={6}><Text strong>技术落脚点</Text><div>{trace.landing_point.name}</div></Col>
              <Col xs={24} sm={12} lg={6}><Text strong>车辆功能</Text><div>{trace.vehicle_function?.name ?? '未关联'}</div></Col>
              <Col xs={24} sm={12} lg={6}><Text strong>需求点</Text><div>{trace.demand_point?.name ?? '未关联'}</div></Col>
              <Col xs={24} sm={12} lg={6}><Text strong>技术主题</Text><div>{trace.theme?.working_name ?? '未关联'}</div></Col>
            </Row>
          </Card>

          <Card className="panel-card" title="需求推导与交叉验证">
            {trace.demand_point ? (
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                {demandSteps.length ? demandSteps.map((step, index) => (
                  <Card key={`${step.key}-${index}`} size="small" title={`${index + 1}. ${step.key}`}>
                    <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{step.content}</Paragraph>
                    <Space wrap>
                      {step.evidence_signal_ids.map((id) => (
                        <Button key={id} type="link" onClick={() => onNavigate(`singal/${id}`)}>
                          回到证据 {id.slice(0, 8)}
                        </Button>
                      ))}
                    </Space>
                  </Card>
                )) : <Text type="secondary">没有保存需求五步推导记录。</Text>}
                <Paragraph type="secondary">
                  交叉验证结论：{trace.demand_cross_validation_conclusion ?? '未记录'}；
                  需求状态：{trace.demand_review_status ?? '未复核'}。
                </Paragraph>
              </Space>
            ) : <Text type="secondary">该功能未关联需求点。</Text>}
          </Card>

          <Card className="panel-card" title="车辆功能推导与反向验证">
            {trace.vehicle_function ? (
              <Row gutter={[18, 18]}>
                <Col xs={24} lg={12}>
                  <Text strong>正向五步</Text>
                  {forwardSteps.length ? (
                    <ol>{forwardSteps.map((step, index) => (
                      <li key={index}><Paragraph style={{ whiteSpace: 'pre-wrap' }}>{typeof step === 'string' ? step : JSON.stringify(step)}</Paragraph></li>
                    ))}</ol>
                  ) : <Paragraph type="secondary">未保存正向步骤。</Paragraph>}
                </Col>
                <Col xs={24} lg={12}>
                  <Text strong>反向验证记录</Text>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                    {trace.vehicle_function.reverse_trace
                      ? JSON.stringify(trace.vehicle_function.reverse_trace, null, 2)
                      : '未保存反向验证记录。'}
                  </Paragraph>
                </Col>
              </Row>
            ) : <Text type="secondary">该需求点尚未形成车辆功能。</Text>}
          </Card>

          <Card className="panel-card" title="部署标准九宫格">
            <Row gutter={[12, 12]}>
              {standardPhases.map((phase) => standardConstraints.map((constraint) => {
                const cell = trace.standards.find((item) => item.phase === phase && item.constraint_type === constraint)
                const text = cell
                  ? cell.requirement_text?.trim() || '已明确留空'
                  : '尚未填写'
                return (
                  <Col key={`${phase}-${constraint}`} xs={24} sm={12} lg={8}>
                    <Card size="small" title={`${phase} · ${constraint}`}>
                      <Text type={cell?.requirement_text?.trim() ? undefined : 'secondary'}>{text}</Text>
                    </Card>
                  </Col>
                )
              }))}
            </Row>
          </Card>

          <Card className="panel-card" title="原始信号、文件与图片">
            {trace.signals.length ? (
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                {trace.signals.map((signal) => (
                  <Card key={signal.id} size="small" title={(
                    <Space wrap>
                      <Text strong>{signal.title}</Text>
                      {signal.trace_relationships.includes('theme_member') ? <Tag color="blue">主题成员</Tag> : null}
                      {signal.trace_relationships.includes('demand_evidence') ? <Tag color="purple">需求直接证据</Tag> : null}
                      {signal.is_archived ? <Tag color="orange">已归档/停用</Tag> : <Tag color="green">{signal.evidence_status_code}</Tag>}
                    </Space>
                  )}>
                    <Space wrap>
                      <Text type="secondary">发布主体：{signal.publisher ?? '未记录'}</Text>
                      <Text type="secondary">更新时间：{formatApiDate(signal.updated_at)}</Text>
                      <Button type="link" onClick={() => onNavigate(`singal/${signal.id}`)}>打开证据</Button>
                      {signal.archive_reference_present ? (
                        <Button type="link" href={signalArchiveUrl(signal.id)} target="_blank" rel="noreferrer">查看网页存档</Button>
                      ) : null}
                    </Space>
                    {signal.document ? (
                      <Space wrap style={{ display: 'flex', marginTop: 8 }}>
                        <Text>文档：{signal.document.filename ?? signal.document.id}</Text>
                        <Tag>{signal.document.ingest_status}</Tag>
                        <Tag>{signal.document.figure_count} 张图块</Tag>
                        {signal.document.canonical_object_reference_present ? (
                          <Button type="link" href={documentCanonicalUrl(signal.document.id)} target="_blank" rel="noreferrer">
                            打开文档正文
                          </Button>
                        ) : <Text type="secondary">尚无可用的规范正文对象</Text>}
                        {signal.document.figure_count > 0 ? (
                          <Button type="link" onClick={() => onNavigate(`singal/${signal.id}`)}>在证据页查看图片</Button>
                        ) : null}
                      </Space>
                    ) : null}
                  </Card>
                ))}
              </Space>
            ) : <PlatformEmptyState title="暂无关联信号" description="该落脚点的主题和证据链目前没有可回溯的信号记录。" />}
          </Card>

          <Card className="panel-card" title="部署边界与战略版本">
            <Row gutter={[18, 18]}>
              <Col xs={24} lg={12}>
                <Text strong>当前部署边界证据</Text>
                {trace.standards.filter((item) => item.requirement_text?.trim()).length ? (
                  <ul>{trace.standards.filter((item) => item.requirement_text?.trim()).map((item) => (
                    <li key={item.id}>{item.phase} · {item.constraint_type}：{item.requirement_text}</li>
                  ))}</ul>
                ) : <Paragraph type="secondary">没有非空部署标准；系统未补写内容。</Paragraph>}
              </Col>
              <Col xs={24} lg={12}>
                {trace.assessment_versions.length ? (
                  <Timeline items={trace.assessment_versions.map((assessment) => ({
                    color: assessment.is_current ? 'green' : 'blue',
                    children: (
                      <Space orientation="vertical" size={4}>
                        <Space wrap>
                          <Text strong>v{assessment.version}</Text>
                          <Tag color={assessment.is_current ? 'green' : 'default'}>{assessment.is_current ? '当前版本' : '历史版本'}</Tag>
                          <Text>{assessment.classification}</Text>
                          <Text>总分 {assessment.score_total}/25</Text>
                        </Space>
                        <Text type="secondary">操作者：{assessment.operator_subject ?? '—'} · {formatApiDate(assessment.assessed_at)}</Text>
                        <Paragraph type="secondary">{assessment.strategy_note ?? '未填写策略备注'}</Paragraph>
                      </Space>
                    ),
                  }))} />
                ) : <Text type="secondary">尚无已定稿战略版本。</Text>}
              </Col>
            </Row>
            <Divider />
            <Alert
              type="info"
              showIcon
              title="依据更新状态：无法确认"
              description="当前数据模型没有需求复核时间基线，系统不会推断信号或标签更新后是否需要重新复核。"
            />
          </Card>
        </Space>
      ) : landingPointId ? (
        <PlatformEmptyState title="暂无推导链" description="该落脚点尚无服务端返回的推导关系。" />
      ) : (
        <PlatformEmptyState title="请选择落脚点" description="当前展示真实已保存的落脚点链路，不生成示例节点或推导结论。" />
      )}
    </div>
  )
}

type EvidenceStageView = 'archive' | 'markdown' | 'assistant' | 'mindmap' | 'report' | 'infographic'

type StudioCacheEntry = {
  mindmap?: StudioMindmapPayload
  report?: string
  infographic?: StudioInfographicPayload
}

const CORE_STAGE_VIEWS: EvidenceStageView[] = ['archive', 'markdown', 'assistant']

function EvidenceDetailWorkspace({ onNavigate, signalId }: { onNavigate: (key: string) => void; signalId: string }) {
  const [sourceOpen, setSourceOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [stageView, setStageView] = useState<EvidenceStageView>('markdown')
  const [bodyText, setBodyText] = useState<string | null>(null)
  const [figureByIndex, setFigureByIndex] = useState<Record<number, string>>({})
  const [studioCacheBySignal, setStudioCacheBySignal] = useState<Record<string, StudioCacheEntry>>({})
  const markdownArticleRef = useRef<HTMLElement>(null)
  const { signal: liveSignal, detail, isLoading, isError } = useSignalDetail(signalId)
  const { maps } = useRefCodeMaps()
  const apiId = detail?.id ?? (isUuid(signalId) ? signalId : null)
  const signal = liveSignal
  const statusTag = signal?.status === '已留存' ? 'green' : signal?.status === '待人工复核' ? 'warning' : 'default'
  const hasArchive = Boolean(detail?.snapshot_html_object_key)
  const isDocumentSource = Boolean(detail?.document_id)
  const linkedDemands = detail?.linked_demand_points ?? []
  const hasBody = Boolean(detail?.body_object_key || bodyText || detail?.excerpt)
  const markdownSource = bodyText ?? detail?.excerpt ?? signal?.title ?? ''
  const studioCacheKey = apiId ?? signal?.key ?? signalId
  const studioCache = studioCacheBySignal[studioCacheKey] ?? {}

  const rememberStudioResult = useCallback(
    (kind: keyof StudioCacheEntry, payload: StudioCacheEntry[keyof StudioCacheEntry]) => {
      setStudioCacheBySignal((prev) => ({
        ...prev,
        [studioCacheKey]: { ...prev[studioCacheKey], [kind]: payload },
      }))
    },
    [studioCacheKey],
  )

  const displayTitle = useMemo(() => {
    const t = signal?.title?.trim() ?? ''
    const cleaned = t.replace(/^(新闻详情|文章详情|详情页?)[\-–—]\s*/, '').trim()
    return cleaned || t
  }, [signal?.title])

  const sourceSummaryPlain = useMemo(() => {
    const raw = (bodyText ?? detail?.excerpt ?? '').trim()
    if (!raw) return null
    return sourceExcerptSnippet(raw, displayTitle, 220)
  }, [bodyText, detail?.excerpt, displayTitle])

  useEffect(() => {
    if (hasArchive) setStageView('archive')
    else if (detail?.body_object_key || detail?.excerpt) setStageView('markdown')
  }, [signalId, hasArchive, detail?.body_object_key, detail?.excerpt])

  useEffect(() => {
    if (!detail?.body_object_key || !apiId) {
      setBodyText(null)
      return
    }
    let cancelled = false
    import('@/lib/api/eea-api').then(({ fetchSignalBody }) =>
      fetchSignalBody(apiId)
        .then((text) => {
          if (!cancelled) setBodyText(text)
        })
        .catch(() => {
          if (!cancelled) setBodyText(null)
        }),
    )
    return () => {
      cancelled = true
    }
  }, [detail?.body_object_key, apiId])

  useEffect(() => {
    if (!hasArchive || !apiId) {
      setFigureByIndex({})
      return
    }
    let cancelled = false
    import('@/lib/evidence/archive-figures').then(({ fetchSignalFigureByIndex }) =>
      fetchSignalFigureByIndex(apiId)
        .then((map) => {
          if (!cancelled) setFigureByIndex(map)
        })
        .catch(() => {
          if (!cancelled) setFigureByIndex({})
        }),
    )
    return () => {
      cancelled = true
    }
  }, [hasArchive, apiId, signalId])

  if (isLoading && !signal) {
    return (
      <div className="content-wrap">
        <Spin />
      </div>
    )
  }

  if (!signal && isError) {
    return (
      <div className="content-wrap">
        <PlatformEmptyState title="无法加载信号" description="请确认信号 ID 有效且 API 已启动。" />
      </div>
    )
  }

  if (!signal) {
    return (
      <div className="content-wrap">
        <PlatformEmptyState title="信号不存在" description="请从证据库打开有效信号。" action={<Button onClick={() => onNavigate('signals')}>返回证据库</Button>} />
      </div>
    )
  }

  const workspaceLayoutClass = [
    'evidence-detail-workspace',
    sourceOpen ? 'source-is-open' : 'source-is-collapsed',
    previewOpen ? 'preview-is-open' : 'preview-is-collapsed',
  ].join(' ')

  const stageTabOptions: { label: string; value: EvidenceStageView; disabled?: boolean }[] = [
    { label: '来源留存', value: 'archive', disabled: !hasArchive },
    { label: '解析快照', value: 'markdown', disabled: !hasBody },
    { label: '研究助手', value: 'assistant' },
  ]

  const onStageTabChange = (value: EvidenceStageView) => {
    if (value === 'assistant') {
      setPreviewOpen(true)
    }
    setStageView(value)
  }

  const segmentedValue = CORE_STAGE_VIEWS.includes(stageView) ? stageView : undefined

  return (
    <div className={workspaceLayoutClass}>
      {sourceOpen && (
        <aside className="evidence-source-column">
          <div className="source-column-header evidence-column-head">
            <div className="pane-heading-row">
              <div>
                <Text className="view-eyebrow">原始证据</Text>
                <Title level={4}>来源</Title>
              </div>
            </div>
          </div>
          <Space wrap className="source-signal-badges">
            <Tag color="cyan">{signal.stage}</Tag>
            <Tag color="purple">{signal.type || '未判定'}</Tag>
            <Tag color={statusTag}>{signal.status}</Tag>
            <Tag>{signal.channel}</Tag>
          </Space>
          <div className="source-card source-card-active source-card-hero">
            <div className="source-card-top">
              <div className="source-card-icon" aria-hidden>
                {signal.channel === '网页' ? 'W' : 'M'}
              </div>
              <div className="source-card-main">
                <Text strong className="source-card-title">
                  {displayTitle}
                </Text>
                {signal.publisher ? (
                  <Text type="secondary" className="source-card-publisher">
                    {signal.publisher}
                  </Text>
                ) : null}
                <dl className="source-card-meta">
                  <div>
                    <dt>采集</dt>
                    <dd>{formatApiDate(detail?.captured_at ?? detail?.updated_at)}</dd>
                  </div>
                  <div>
                    <dt>更新</dt>
                    <dd>{signal.date}</dd>
                  </div>
                </dl>
                <Text type="secondary" className="source-card-id">
                  {apiId ?? signal.key}
                </Text>
                {detail?.document_id ? (
                  <Text type="secondary" className="source-card-doc-link">
                    文档来源 ·{' '}
                    <Button type="link" size="small" href={documentCanonicalUrl(detail.document_id)} target="_blank" rel="noopener noreferrer">
                      canonical.md
                    </Button>
                  </Text>
                ) : null}
              </div>
            </div>
            <div className="source-card-excerpt source-metadata">
              <div className="source-metadata-head">
                <Text type="secondary">来源摘要</Text>
                {hasBody ? (
                  <Button type="link" size="small" onClick={() => onStageTabChange('markdown')}>
                    展开全文
                  </Button>
                ) : null}
              </div>
              <p>
                {sourceSummaryPlain ??
                  '已完成来源留存与机器预标；可在中间区域查看解析快照，或使用右侧工作室工具。'}
              </p>
            </div>
          </div>
          <Divider />
          {apiId ? (
            <>
              <SignalClassificationEditor
                signalId={apiId}
                stageCode={detail?.value_chain_stage_code ?? null}
                typeCode={detail?.signal_type_code ?? null}
              />
              <Divider />
              <SignalTagsEditor signalId={apiId} tags={signal.tags} />
              <Divider />
              <SignalCorrectionAudit signalId={apiId} />
              <Divider />
              <SignalThemeAssign
                signalId={apiId}
                themeId={detail?.tech_theme_id ?? detail?.theme?.id ?? null}
                themeName={detail?.theme?.working_name ?? null}
                isDocumentSource={isDocumentSource}
              />
            </>
          ) : null}
          <Divider />
          <Text type="secondary">关联信息</Text>
          <div className="source-list">
            <div className="source-list-item">
              <span>关联需求</span>
              {linkedDemands.length ? (
                <Space wrap size={[4, 4]}>
                  {linkedDemands.map((dp) => (
                    <Tag key={dp.id} color="geekblue">
                      {dp.name}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Tag>未关联 / 待评估</Tag>
              )}
            </div>
            <div className="source-list-item">
              <span>可信度</span>
              <Tag>待评估</Tag>
            </div>
          </div>
        </aside>
      )}
      <section className="evidence-stage-column">
        <header className="evidence-stage-header">
          <div className="evidence-stage-header-start">
            <Tooltip title={sourceOpen ? '收起来源' : '打开来源'}>
              <Button
                className="evidence-stage-icon-btn"
                type="default"
                icon={sourceOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                aria-label={sourceOpen ? '收起来源' : '打开来源'}
                onClick={() => setSourceOpen(!sourceOpen)}
              />
            </Tooltip>
          </div>
          <div className="evidence-stage-header-tabs">
            <Segmented
              value={segmentedValue}
              options={stageTabOptions}
              onChange={(value) => onStageTabChange(value as EvidenceStageView)}
            />
          </div>
          <div className="evidence-stage-header-end">
            <Tooltip title={previewOpen ? '收起工具' : '打开工具'}>
              <Button
                className="evidence-stage-icon-btn"
                type="default"
                icon={<ToolOutlined />}
                aria-label={previewOpen ? '收起工具' : '打开工具'}
                onClick={() => setPreviewOpen(!previewOpen)}
              />
            </Tooltip>
          </div>
        </header>
        {stageView === 'markdown' && hasBody ? (
          <EvidenceAudioTransport markdown={markdownSource} articleRef={markdownArticleRef} />
        ) : null}
        <div className="evidence-stage-panel">
          <div className={`evidence-stage-tab-pane${stageView === 'archive' ? ' is-active' : ''}`}>
            {hasArchive && apiId ? (
              <iframe
                title="HTML 归档回放"
                className="evidence-archive-frame-full"
                sandbox=""
                referrerPolicy="no-referrer"
                src={signalArchiveUrl(apiId)}
              />
            ) : (
              <PlatformEmptyState title="暂无 HTML 归档" description="该信号未留存 SingleFile 快照，可查看解析快照或继续用研究助手提问。" />
            )}
          </div>
          <div className={`evidence-stage-tab-pane${stageView === 'markdown' ? ' is-active' : ''}`}>
            <SignalBodyMarkdown
              ref={markdownArticleRef}
              markdown={markdownSource || signal.title}
              figureByIndex={figureByIndex}
            />
          </div>
          <div className={`evidence-stage-tab-pane${stageView === 'mindmap' ? ' is-active' : ''}`}>
            <EvidenceStudioPane
              signalId={apiId}
              kind="mindmap"
              cached={studioCache.mindmap}
              onLoaded={(payload) => rememberStudioResult('mindmap', payload as StudioMindmapPayload)}
            />
          </div>
          <div className={`evidence-stage-tab-pane${stageView === 'report' ? ' is-active' : ''}`}>
            <EvidenceStudioPane
              signalId={apiId}
              kind="report"
              cached={studioCache.report}
              onLoaded={(payload) => rememberStudioResult('report', payload as string)}
            />
          </div>
          <div className={`evidence-stage-tab-pane${stageView === 'infographic' ? ' is-active' : ''}`}>
            <EvidenceStudioPane
              signalId={apiId}
              kind="infographic"
              cached={studioCache.infographic}
              onLoaded={(payload) => rememberStudioResult('infographic', payload as StudioInfographicPayload)}
            />
          </div>
          <div
            className={`evidence-stage-tab-pane evidence-stage-tab-pane-assistant${stageView === 'assistant' ? ' is-active' : ''}`}
          >
            <div className="evidence-assistant-shell chat-card evidence-stage-chat">
              <EvidenceAssistantChat signalId={apiId} />
            </div>
          </div>
        </div>
      </section>
      {previewOpen ? (
        <aside className="evidence-preview-column">
          <div className="preview-header evidence-column-head">
            <div>
              <Text className="view-eyebrow">证据工具</Text>
              <Title level={4}>快捷面板</Title>
              <Text type="secondary" className="evidence-stage-subtitle">
                元数据与常用操作；主视图在左侧标签与中间区域切换。
              </Text>
            </div>
            <Button type="link" size="small" onClick={() => setPreviewOpen(false)}>
              收起
            </Button>
          </div>
          <div className="evidence-preview-body">
            <dl className="evidence-meta">
              <dt>信号</dt>
              <dd>{signal.key}</dd>
              <dt>状态</dt>
              <dd>{signal.status}</dd>
              <dt>渠道</dt>
              <dd>{signal.channel}</dd>
              <dt>主题</dt>
              <dd>{detail?.theme?.working_name ?? '未关联'}</dd>
            </dl>
          </div>
          <div className="evidence-preview-footer">
            <div className="studio-action-grid">
              <Button block icon={<BranchesOutlined />} onClick={() => onNavigate('traceDetail')}>
                推导链
              </Button>
              <Button block icon={<FileSearchOutlined />} disabled={!hasArchive} onClick={() => onStageTabChange('archive')}>
                归档
              </Button>
              <Button block icon={<ReadOutlined />} disabled={!hasBody} onClick={() => onStageTabChange('markdown')}>
                快照
              </Button>
              <Button block icon={<BulbOutlined />} onClick={() => onStageTabChange('assistant')}>
                助手
              </Button>
              <Button block icon={<AudioOutlined />} disabled={!hasBody} onClick={() => onStageTabChange('markdown')}>
                音频概览
              </Button>
              <Button block icon={<ApartmentOutlined />} disabled={!hasBody} onClick={() => onStageTabChange('mindmap')}>
                导图
              </Button>
              <Button block icon={<FileTextOutlined />} disabled={!hasBody} onClick={() => onStageTabChange('report')}>
                报告
              </Button>
              <Button block icon={<PictureOutlined />} disabled={!hasBody} onClick={() => onStageTabChange('infographic')}>
                信息图
              </Button>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  )
}

function PlaceholderView({ config }: { config: (typeof utilityPages)[string] }) {
  return <ProCard className="page-placeholder" bordered={false} boxShadow><div className="placeholder-icon"><SettingOutlined /></div><Title level={3}>{config.title}</Title><Text type="secondary">{config.description}</Text><Tag color="default">暂不可用</Tag><Text type="secondary">当前没有可用的服务端数据或操作接口。</Text></ProCard>
}

export function UtilityView({ page, onNavigate, signalId }: { page: keyof typeof utilityPages; onNavigate: NavigateFn; signalId: string }) {
  const config = utilityPages[page]
  const isCreateTopic = page === 'createTopic'
  const isReport = page === 'report'
  const isKnowledge = page === 'knowledge'
  if (page === 'traceDetail') {
    return (
      <>
        <PageHeader
          eyebrow={config.eyebrow}
          title={config.title}
          description={config.description}
          action={<Button onClick={() => onNavigate('trace')}>返回追溯总览</Button>}
        />
        <DeductionChainWorkspace onNavigate={onNavigate} initialLandingPointId={signalId || undefined} />
      </>
    )
  }
  if (page === 'singal') {
    return <EvidenceDetailWorkspace onNavigate={onNavigate} signalId={signalId} />
  }
  if (page === 'workflow') return <WorkflowStudio />
  if (page === 'profile') {
    return (
      <ProfilePage config={config} />
    )
  }
  if (isCreateTopic) {
    return (
      <>
        <PageHeader eyebrow={config.eyebrow} title={config.title} description="创建一个研究主题，之后在信号详情中把证据归集进来。" />
        <CreateTopicForm onNavigate={onNavigate} />
      </>
    )
  }
  if (isKnowledge) {
    return (
      <>
        <PageHeader eyebrow={config.eyebrow} title={config.title} description="技术方向词表来自已入库信号，可跳回证据列表。" />
        <VocabKnowledgePanel onNavigate={onNavigate} />
      </>
    )
  }
  if (page === 'settings') return <PlatformSettingsPage config={config} />
  if (isReport || page === 'notifications' || page === 'search') {
    return (
      <>
        <PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} />
        <PlaceholderView config={config} />
      </>
    )
  }
  return <>
    <PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} />
    <NewSignalImportPage onNavigate={onNavigate} />
  </>
}

export function DashboardWorkspace({ initialView, signalId }: { initialView: string; signalId: string }) {
  const { message: messageApi } = AntApp.useApp()
  const [collapsed, setCollapsed] = useState(() => initialView === 'singal')
  const [isMobile, setIsMobile] = useState(false)
  const [layoutReady, setLayoutReady] = useState(false)
  const [activeMenu, setActiveMenu] = useState(initialView)
  const [activeSignalId, setActiveSignalId] = useState(signalId)
  const [signalPreview, setSignalPreview] = useState<Signal | null>(null)
  const [query, setQuery] = useState('')
  const [themeFilter, setThemeFilter] = useState<string | undefined>()
  const [stage, setStage] = useState('全部环节')
  const routeKeys = useMemo(() => new Set([...ALL_VIEW_KEYS, 'overview']), [])
  const overviewQuery = useOverviewStats()
  const overview = overviewQuery.data
  const refCodesQuery = useRefCodeMaps()
  const {
    rows: cachedSignals,
    isLoading: signalsQueryLoading,
    isError: signalsQueryError,
    refetch: refetchSignals,
  } = useSignalsListFiltered({ query, stageChip: stage })
  const themeQuery = useThemeRows()
  const themeRows = themeQuery.rows
  const signalsLoading = signalsQueryLoading || (!refCodesQuery.isSuccess && !refCodesQuery.isError)
  const signalsError = signalsQueryError || refCodesQuery.isError
  const themesLoading = themeQuery.isLoading || (!refCodesQuery.isSuccess && !refCodesQuery.isError)
  const themesError = themeQuery.isError || refCodesQuery.isError
  const { rows: demandRows } = useDemandRows()
  const { rows: landingRows } = useLandingRows()

  const traceMetrics = useMemo(
    () => (overviewQuery.isSuccess && overview ? overviewToTraceMetrics(overview) : []),
    [overview, overviewQuery.isSuccess],
  )
  const overviewThemes = themeRows

  useEffect(() => {
    setLivePlatformSearchData({
      signals: cachedSignals,
      themes: themeRows,
      demands: demandRows,
      landings: landingRows,
    })
    resetPlatformSearchIndex()
  }, [cachedSignals, themeRows, demandRows, landingRows])
  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    setIsMobile(mq.matches)
    const requestedView = initialView
    const nextView = requestedView in utilityPages || mainMenuItems?.some((item) => item && 'key' in item && item.key === requestedView) ? requestedView : 'overview'
    setActiveMenu(nextView)
    setCollapsed(mq.matches || nextView === 'singal')
    setLayoutReady(true)
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
      if (event.matches) setCollapsed(true)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [initialView])

  useEffect(() => {
    const syncRoute = () => {
      const pathnameParts = window.location.pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part))
      const queryView = new URLSearchParams(window.location.search).get('view')
      const view = pathnameParts[0] ?? queryView ?? 'overview'
      setActiveMenu(routeKeys.has(view) ? view : 'overview')
      setActiveSignalId(pathnameParts[1] ?? '')
      const params = new URLSearchParams(window.location.search)
      setThemeFilter(params.get('theme_id') ?? undefined)
      const keyword = params.get('keyword')
      if (keyword !== null) setQuery(keyword)
    }
    syncRoute()
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [routeKeys])

  useEffect(() => {
    if (activeMenu === 'singal' || activeMenu === 'traceDetail') {
      setSignalPreview(null)
    }
  }, [activeMenu])

  const navigateTo = ({ view, id, query: routeQuery, hash }: AppRouteOptions) => {
    const nextView = routeKeys.has(view) ? view : 'overview'
    setActiveMenu(nextView)
    setActiveSignalId(id ?? '')
    if (nextView === 'singal') setCollapsed(true)
    const path = buildAppPath({ view: nextView, id, query: routeQuery, hash })
    window.history.pushState({ view: nextView, id }, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
    if (nextView === 'signals') {
      setThemeFilter(routeQuery?.theme_id)
      if (routeQuery?.keyword !== undefined) setQuery(routeQuery.keyword)
      if (routeQuery?.trend) setQuery(`第 ${routeQuery.trend.replace(/^w/, '')} 周`)
      if (routeQuery?.funnel === 'scan') {
        setQuery('')
        setStage('全部环节')
        setThemeFilter(undefined)
      }
    }
  }
  const navigate = (target: string | AppRouteOptions) => {
    setSignalPreview(null)
    if (typeof target === 'string') {
      const [view, id] = target.split('/')
      navigateTo({ view, id })
      return
    }
    navigateTo(target)
  }
  useEffect(() => {
    if (activeMenu !== 'signals') return
    const params = new URLSearchParams(window.location.search)
    const trend = params.get('trend')
    if (trend) setQuery(`第 ${trend.replace(/^w/, '')} 周`)
  }, [activeMenu])
  const [isDark, setIsDark] = useState(false)

  const filteredSignals = cachedSignals

  const signalTableColumns = buildSignalTableColumns({
    onNavigate: navigate,
    onTitleClick: (record) => navigate(`singal/${record.key}`),
  })

  const primaryMenuSelectedKeys = useMemo(
    () => (mainMenuItems?.some((item) => item && 'key' in item && item.key === activeMenu) ? [activeMenu] : []),
    [activeMenu],
  )

  const siderUtilitySelectedKeys = useMemo(() => {
    if (activeMenu === 'knowledge') return ['knowledge']
    if (activeMenu === 'settings') return ['settings']
    return []
  }, [activeMenu])

  const isEvidenceStudio = activeMenu === 'singal'
  const { signal: evidenceBarSignal, isLoading: evidenceBarLoading } = useSignalDetail(
    isEvidenceStudio ? activeSignalId : '',
  )
  const evidencePageTitle = isEvidenceStudio
    ? evidenceBarSignal?.title ??
      (evidenceBarLoading ? '加载中…' : utilityPages.singal.title)
    : undefined

  return (
      <PlatformLayout
        activeMenu={activeMenu}
        collapsed={collapsed}
        isMobile={isMobile}
        isDark={isDark}
        layoutReady={layoutReady}
        primaryMenuSelectedKeys={primaryMenuSelectedKeys}
        siderUtilitySelectedKeys={siderUtilitySelectedKeys}
        pageTitleOverride={evidencePageTitle}
        onCollapse={setCollapsed}
        onNavigate={navigate}
        onToggleDark={() => setIsDark((value) => !value)}
      >
            {activeMenu !== 'overview' ? (
            <div className={isEvidenceStudio ? 'content-wrap content-wrap-evidence-studio' : 'content-wrap'}>
              {activeMenu === 'signals' && (
                <SignalsView
                  query={query}
                  setQuery={setQuery}
                  themeId={themeFilter}
                  onPreviewSignal={setSignalPreview}
                  onClearTheme={() => {
                    setThemeFilter(undefined)
                    const path = buildAppPath({ view: 'signals', query: query ? { keyword: query } : undefined })
                    window.history.pushState({ view: 'signals' }, '', path)
                  }}
                  onNavigate={navigate}
                />
              )}
              {activeMenu === 'topics' && <TopicsView onNavigate={navigate} />}
              {activeMenu === 'trace' && <TraceView onNavigate={navigate} />}
              {activeMenu === 'technology' && <TechnologyView />}
              {activeMenu === 'strategy' && <StrategyView />}
              {utilityPages[activeMenu] && <UtilityView page={activeMenu as keyof typeof utilityPages} onNavigate={navigate} signalId={activeSignalId} />}
            </div>
            ) : (
            <div className="content-wrap">
              <div className="welcome-row"><div><Title level={2}>研究工作台</Title><Text type="secondary">查看平台中已保存的研究数据与推导进展。</Text></div><Space><Button icon={<CloudDownloadOutlined />} onClick={() => navigate('report')}>报告</Button><Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('newSignal')}>新增信号</Button></Space></div>
              {overviewQuery.isError ? (
                <QueryFailure
                  message="总览数据加载失败，请检查服务连接后重试。"
                  onRetry={() => { void overviewQuery.refetch() }}
                />
              ) : null}
              <Row gutter={[16, 16]} className="overview-metrics">
                <Col xs={24} sm={12} xl={6}>
                  <Card variant="borderless" className="panel-card metric-tile">
                    <Statistic
                      title={<span><RadarChartOutlined /> 信号总数</span>}
                      value={overviewQuery.isSuccess ? overview?.signals ?? 0 : '—'}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Card variant="borderless" className="panel-card metric-tile">
                    <Statistic title={<span><TagsOutlined /> 技术主题</span>} value={overviewQuery.isSuccess ? overview?.tech_themes ?? 0 : '—'} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Card variant="borderless" className="panel-card metric-tile">
                    <Statistic title={<span><FundProjectionScreenOutlined /> 需求点</span>} value={overviewQuery.isSuccess ? overview?.demand_points ?? 0 : '—'} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Card variant="borderless" className="panel-card metric-tile">
                    <Statistic title={<span><BulbOutlined /> 战略研判</span>} value={overviewQuery.isSuccess ? overview?.funnel_pool ?? 0 : '—'} suffix="项" />
                  </Card>
                </Col>
              </Row>
              {overviewQuery.isSuccess && overview?.weekly_new ? (
                <Card
                  className="panel-card"
                  title="本周新增"
                  extra={<Text type="secondary">UTC {formatApiDate(overview.weekly_window_start_utc)} 至 {formatApiDate(overview.as_of_utc)}</Text>}
                  style={{ marginTop: 16 }}
                >
                  <Row gutter={[16, 16]}>
                    {[
                      ['信号', overview.weekly_new.signals],
                      ['主题', overview.weekly_new.tech_themes],
                      ['需求点', overview.weekly_new.demand_points],
                      ['车辆功能', overview.weekly_new.vehicle_functions],
                      ['技术落脚点', overview.weekly_new.landing_points],
                      ['战略版本', overview.weekly_new.strategic_assessments],
                      ['文档', overview.weekly_new.documents],
                    ].map(([label, value]) => (
                      <Col key={String(label)} xs={12} sm={8} xl={3}>
                        <Statistic title={String(label)} value={Number(value)} />
                      </Col>
                    ))}
                  </Row>
                </Card>
              ) : null}
              {overviewQuery.isSuccess && overview ? (
                <Card className="panel-card" title="待处理与失败任务" style={{ marginTop: 16 }}>
                  <Space wrap>
                    <Tag color="orange">待复核信号：{overview.signals_pending_review}</Tag>
                    <Tag color="orange">待复核需求：{overview.demand_points_pending_review ?? 0}</Tag>
                    <Tag>采集任务进行中：{overview.capture_jobs_open ?? 0}</Tag>
                    <Tag color={(overview.capture_jobs_failed ?? 0) > 0 ? 'red' : 'default'}>采集失败：{overview.capture_jobs_failed ?? 0}</Tag>
                    <Tag color={(overview.signals_fetch_failed ?? 0) > 0 ? 'red' : 'default'}>抓取失败信号：{overview.signals_fetch_failed ?? 0}</Tag>
                    <Tag color={(overview.documents_failed_ingest ?? 0) > 0 ? 'red' : 'default'}>文档解析失败：{overview.documents_failed_ingest ?? 0}</Tag>
                  </Space>
                </Card>
              ) : null}
              <Row gutter={[18, 18]} className="main-grid">
                <Col xs={24} lg={15}>
                  <Card variant="borderless" className="panel-card" title={<div><Title level={4}>技术主题动态</Title><Text type="secondary">频次按未归档主题成员信号数；来源数按规范化 URL 去重，包含归档记录。</Text></div>} extra={<Button type="link" onClick={() => navigate('topics')}>查看全部 <ArrowRightOutlined /></Button>}>
                    {themesError ? (
                      <QueryFailure message="技术主题加载失败，请检查服务连接后重试。" onRetry={() => { void (refCodesQuery.isError ? refCodesQuery.refetch() : themeQuery.refetch()) }} />
                    ) : themesLoading ? (
                      <Spin />
                    ) : overviewThemes.length ? (
                      <div className="theme-list">
                        {overviewThemes.map((theme) => (
                          <div className="theme-row clickable-row" key={theme.id} role="button" tabIndex={0} onClick={() => navigate('topics')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') navigate('topics') }}>
                            <div className="theme-icon" style={{ background: `${theme.color}14`, color: theme.color }}><RadarChartOutlined /></div>
                            <div className="theme-info"><div className="theme-name"><Text strong>{theme.name}</Text></div><Text type="secondary">{theme.count} 条信号 · {theme.sources} 个来源</Text></div>
                            <ArrowRightOutlined className="row-arrow" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <PlatformEmptyState title="暂无技术主题" description="主题将在保存真实信号并完成人工归集后显示。" action={<Button type="link" onClick={() => navigate('topics')}>打开主题工作台</Button>} />
                    )}
                  </Card>
                </Col>
                <Col xs={24} lg={9}>
                  <Card variant="borderless" className="panel-card funnel-card" title={<div><Title level={4}>战略研判</Title><Text type="secondary">按落脚点当前状态独占计数；第 4 步含待定稿与已定稿。</Text></div>} extra={<Button type="text" icon={<MoreOutlined />} aria-label="打开战略研判" onClick={() => navigate('strategy')} />}>
                    {overviewQuery.isError ? <QueryFailure message="战略研判数据加载失败，请检查服务连接后重试。" onRetry={() => { void overviewQuery.refetch() }} /> : overviewQuery.isLoading ? <Spin /> : (
                      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                        <Statistic title="当前战略版本数" value={overview?.funnel_pool ?? 0} suffix="项" />
                        {overview?.strategy_funnel ? (
                          <Space wrap>
                            <Tag color="blue">扫描 {overview.strategy_funnel.industry_scan}</Tag>
                            <Tag color="blue">适配 {overview.strategy_funnel.tier1_adaptation}</Tag>
                            <Tag color="blue">评分 {overview.strategy_funnel.scoring}</Tag>
                            <Tag color="blue">策略 {overview.strategy_funnel.classification}</Tag>
                            <Tag color="orange">拒绝 {overview.strategy_funnel.rejected}</Tag>
                            <Tag>未入池 {overview.strategy_funnel.pool_entry_blocked}</Tag>
                          </Space>
                        ) : <Text type="secondary">当前服务尚未提供漏斗阶段计数。</Text>}
                      </Space>
                    )}
                  </Card>
                </Col>
              </Row>
              <Card className="panel-card view-card signals-panel" title="最新信号" extra={<Space wrap><Input allowClear prefix={<SearchOutlined />} placeholder="搜索标题、发布主体或标签" value={query} onChange={(e) => setQuery(e.target.value)} /><Select value={stage} onChange={setStage} options={['全部环节', '创造端', '传递端', '兑现端', '规制端'].map((item) => ({ label: item, value: item }))} suffixIcon={<FilterOutlined />} className="stage-select" /><Button type="link" onClick={() => navigate('signals')}>打开证据库 <ArrowRightOutlined /></Button></Space>}>
                {signalsError ? (
                  <QueryFailure message="最新信号加载失败，请检查服务连接后重试。" onRetry={() => { void (refCodesQuery.isError ? refCodesQuery.refetch() : refetchSignals()) }} />
                ) : (
                  <Table rowKey="key" loading={signalsLoading} columns={signalTableColumns} dataSource={filteredSignals} pagination={{ pageSize: 6 }} scroll={{ x: 960 }} locale={signalsTableLocale(() => navigate('newSignal'))} />
                )}
              </Card>
              <Card
                variant="borderless"
                className="panel-card trace-strip-card"
                title={(
                  <div>
                    <Title level={4}>链路追溯</Title>
                    <Text type="secondary">从原始信号到战略研判，追踪每一项技术判断的来路。</Text>
                  </div>
                )}
                extra={<Button type="primary" icon={<ArrowRightOutlined />} onClick={() => navigate('traceDetail')}>进入追溯视图</Button>}
              >
                {overviewQuery.isError ? null : overviewQuery.isLoading ? <Spin /> : (
                <Row gutter={[16, 16]} align="middle">
                  {traceMetrics.map((metric) => (
                    <Col key={metric.label} xs={12} sm={6}>
                      <Statistic title={metric.label} value={metric.value} />
                    </Col>
                  ))}
                </Row>
                )}
              </Card>
            </div>
            )}
            <SignalQuickPreviewDrawer
              signal={activeMenu === 'signals' ? signalPreview : null}
              onClose={() => setSignalPreview(null)}
              onOpenFull={(key) => {
                setSignalPreview(null)
                navigate(`singal/${key}`)
              }}
            />
      </PlatformLayout>
  )
}
