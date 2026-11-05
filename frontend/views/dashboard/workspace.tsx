'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
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
import { DeductionChainRadar } from '@/components/deduction-chain-radar'
import { PlatformLayout } from '@/components/layout/platform-layout'
import { StrategyFunnelCard } from '@/components/overview/strategy-funnel-card'
import { PageHeader } from '@/components/shared/page-header'
import { mainMenuItems } from '@/config/menu'
import { utilityPages } from '@/config/utility-pages'
import { ALL_VIEW_KEYS } from '@/config/routes'
import { landingPoints, strategyStageLabels } from '@/mocks/demands'
import { signals, statusColors } from '@/mocks/signals'
import { overviewFunnelSteps, overviewTraceMetrics, signalTrendBars, themes } from '@/mocks/themes'
import {
  useDemandRows,
  useLandingRows,
  useOverviewStats,
  usePanoramaStages,
  useSignalDetail,
  useSignalsWithFallback,
  useThemeRows,
  useRefCodeMaps,
} from '@/hooks/use-eea-queries'
import { overviewToFunnelSteps, overviewToTraceMetrics, formatApiDate, type OverviewThemeRow } from '@/lib/eea-mappers'
import { setLivePlatformSearchData } from '@/lib/live-platform-data'
import { resetPlatformSearchIndex } from '@/lib/platform-search-index'
import { isUuid } from '@/lib/api/api-errors'
import { signalArchiveUrl, documentCanonicalUrl } from '@/lib/api/client'
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
import { PlatformEmptyState, signalsTableLocale } from '@/components/shared/empty-state'
import { NewSignalImportPage } from '@/components/import/new-signal-import'
import { WorkflowStudio } from '@/components/workflow-studio'
import { PlatformSettingsPage } from '@/views/utility/platform-settings-page'
import { ProfilePage } from '@/views/utility/profile-page'

const { Text, Title, Paragraph } = Typography

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
        messageApi.success(`已将「${record.title}」加入待归集队列`)
        onNavigate('createTopic')
        break
      case 'trace':
        onNavigate('traceDetail')
        break
      case 'review':
        messageApi.info('已打开人工复核工作台')
        onNavigate('signals')
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
        messageApi.warning(`「${record.title}」已标记为归档停用（演示）`)
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
  const { rows: signalRows, isLoading, usingMock } = useSignalsWithFallback({ query, stageChip: stage, themeId })
  const { data: overview, isSuccess: overviewReady } = useOverviewStats()
  const totalSignals = overviewReady ? (overview?.signals ?? 0) : signalRows.length
  const retained = overviewReady
    ? (overview ? overview.signals - overview.signals_pending_review : 0)
    : signalRows.filter((s) => s.status === '已留存').length
  const pending = overviewReady ? (overview?.signals_pending_review ?? 0) : signalRows.filter((s) => s.status === '待人工复核').length
  const columns = buildSignalTableColumns({
    onNavigate,
    onTitleClick: onPreviewSignal,
    onQuickPreview: onPreviewSignal,
  })
  return <><PageHeader eyebrow="01 · 原始信息采集" title="信号与证据库" description="收集产业信号，留存可追溯证据，并通过封闭词表完成机器预标。" action={<Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('newSignal')}>粘贴 URL 抓取</Button>} />{usingMock ? <Alert type="warning" showIcon title="演示数据" description="无法连接 API，当前列表为离线演示数据。" style={{ marginBottom: 16 }} /> : null}{themeId ? <Alert type="info" showIcon style={{ marginBottom: 16 }} title="正在查看该主题下的信号" action={<Button size="small" onClick={onClearTheme}>清除主题筛选</Button>} /> : null}<Row gutter={16} className="summary-row"><Col span={6}><Card><Statistic title="全部信号" value={totalSignals} /></Card></Col><Col span={6}><Card><Statistic title="已留存" value={retained} styles={{ content: { color: '#16a34a' } }} /></Card></Col><Col span={6}><Card><Statistic title="待人工复核" value={pending} styles={{ content: { color: '#d97706' } }} /></Card></Col><Col span={6}><Card><Statistic title="本周新增" value={totalSignals} styles={{ content: { color: '#2563eb' } }} /></Card></Col></Row><Card className="panel-card view-card" title="证据列表" extra={<Space wrap><Input allowClear prefix={<SearchOutlined />} placeholder="搜索标题、发布主体或标签" value={query} onChange={(e) => setQuery(e.target.value)} /><Select value={stage} onChange={setStage} options={['全部环节', '创造端', '传递端', '兑现端', '规制端'].map((value) => ({ value, label: value }))} /></Space>}><Table rowKey="key" loading={isLoading} columns={columns} dataSource={signalRows} pagination={{ pageSize: 6 }} scroll={{ x: 960 }} locale={signalsTableLocale(() => onNavigate('newSignal'))} /></Card></>
}

const technologyGraphCategoryColors: Record<string, string> = {
  需求: '#2563eb',
  硬件: '#0891b2',
  电源: '#16a34a',
  标准: '#7c3aed',
  平台: '#f59e0b',
  互联: '#ea580c',
  能力: '#0d9488',
  落地: '#64748b',
}

/** Soft limits allow extra room; hard limits are where the viewport springs back to. */
const technologyGraphViewport = {
  zoomMinHard: 0.58,
  zoomMaxHard: 1.72,
  zoomMinSoft: 0.5,
  zoomMaxSoft: 1.9,
  panHard: [0.22, 0.28, 0.22, 0.28] as [number, number, number, number],
  panSoft: [0.36, 0.42, 0.36, 0.42] as [number, number, number, number],
  nodeHardPad: 72,
  nodeSoftPad: 168,
}

const technologyGraphBounce = {
  duration: 520,
  easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
}

type TechnologyGraphBounds = { minX: number; minY: number; maxX: number; maxY: number }

type TechnologyGraphSession = {
  baseline: { viewportCenter: [number, number]; zoom: number; width: number; height: number }
  contentBounds: TechnologyGraphBounds
}

const technologyGraphSessions = new WeakMap<import('@antv/g6').Graph, TechnologyGraphSession>()

function computeTechnologyContentBounds(graph: import('@antv/g6').Graph): TechnologyGraphBounds {
  const nodes = graph.getNodeData()
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const node of nodes) {
    const [x, y] = graph.getElementPosition(node.id)
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }
  return { minX, minY, maxX, maxY }
}

/** Same coordinate space as G6 drag-canvas (viewport center on canvas). */
function clampTechnologyViewportCenter(
  center: [number, number],
  home: [number, number],
  width: number,
  height: number,
  pan: [number, number, number, number],
): [number, number] {
  const [top, right, bottom, left] = pan
  const [hx, hy] = home
  const minX = hx - width * left
  const maxX = hx + width * right
  const minY = hy - height * top
  const maxY = hy + height * bottom
  return [Math.min(Math.max(center[0], minX), maxX), Math.min(Math.max(center[1], minY), maxY)]
}

function isOutsideTechnologyViewportPan(
  center: [number, number],
  session: TechnologyGraphSession,
  pan: [number, number, number, number],
): boolean {
  const { baseline } = session
  const clamped = clampTechnologyViewportCenter(
    center,
    baseline.viewportCenter,
    baseline.width,
    baseline.height,
    pan,
  )
  return Math.abs(clamped[0] - center[0]) > 0.5 || Math.abs(clamped[1] - center[1]) > 0.5
}

function clampTechnologyZoom(zoom: number, baselineZoom: number, minRatio: number, maxRatio: number) {
  return Math.min(Math.max(zoom, baselineZoom * minRatio), baselineZoom * maxRatio)
}

function clampTechnologyNodePosition(
  position: [number, number],
  bounds: TechnologyGraphBounds,
  pad: number,
): [number, number] {
  return [
    Math.min(Math.max(position[0], bounds.minX - pad), bounds.maxX + pad),
    Math.min(Math.max(position[1], bounds.minY - pad), bounds.maxY + pad),
  ]
}

async function bounceTechnologyGraphViewport(graph: import('@antv/g6').Graph) {
  const session = technologyGraphSessions.get(graph)
  if (!session) return

  const { baseline } = session
  const { zoomMinHard, zoomMaxHard, panHard } = technologyGraphViewport

  const viewportCenter = graph.getViewportCenter()
  const currentCenter: [number, number] = [viewportCenter[0], viewportCenter[1]]
  const targetCenter = clampTechnologyViewportCenter(
    currentCenter,
    baseline.viewportCenter,
    baseline.width,
    baseline.height,
    panHard,
  )
  const currentZoom = graph.getZoom()
  const targetZoom = clampTechnologyZoom(currentZoom, baseline.zoom, zoomMinHard, zoomMaxHard)

  const tasks: Promise<void>[] = []
  if (Math.abs(targetCenter[0] - currentCenter[0]) > 0.5 || Math.abs(targetCenter[1] - currentCenter[1]) > 0.5) {
    const delta: [number, number] = [currentCenter[0] - targetCenter[0], currentCenter[1] - targetCenter[1]]
    tasks.push(graph.translateBy(delta, technologyGraphBounce))
  }
  if (Math.abs(targetZoom - currentZoom) > 0.001) {
    tasks.push(graph.zoomTo(targetZoom, technologyGraphBounce))
  }
  if (tasks.length > 0) await Promise.all(tasks)
}

async function bounceTechnologyGraphNodes(graph: import('@antv/g6').Graph, ids: string[]) {
  const session = technologyGraphSessions.get(graph)
  if (!session || ids.length === 0) return

  const { contentBounds } = session
  const { nodeHardPad } = technologyGraphViewport
  const positions: Record<string, [number, number]> = {}
  let needsBounce = false

  for (const id of ids) {
    const current = graph.getElementPosition(id) as [number, number]
    const target = clampTechnologyNodePosition(current, contentBounds, nodeHardPad)
    if (target[0] !== current[0] || target[1] !== current[1]) {
      positions[id] = target
      needsBounce = true
    }
  }

  if (needsBounce) {
    await graph.translateElementTo(positions, true)
  }
}

const technologyGraphEdges = [
  { source: 'demand', target: 'controller' },
  { source: 'demand', target: 'power' },
  { source: 'controller', target: 'efuse' },
  { source: 'controller', target: 'compute' },
  { source: 'power', target: 'efuse' },
  { source: 'efuse', target: 'safety' },
  { source: 'compute', target: 'serdes' },
  { source: 'safety', target: 'health' },
  { source: 'health', target: 'deploy' },
  { source: 'serdes', target: 'deploy' },
] as const

function buildTechnologyGraphNodes(width: number, height: number) {
  const x = (ratio: number) => ratio * width
  const y = (ratio: number) => ratio * height
  const specs = [
    { id: 'demand', label: '需求点', category: '需求', px: 0.1, py: 0.5 },
    { id: 'controller', label: '区域控制器', category: '硬件', px: 0.26, py: 0.24 },
    { id: 'power', label: '智能配电', category: '电源', px: 0.26, py: 0.76 },
    { id: 'efuse', label: 'eFuse', category: '硬件', px: 0.44, py: 0.5 },
    { id: 'safety', label: '功能安全', category: '标准', px: 0.56, py: 0.22 },
    { id: 'compute', label: '中央计算', category: '平台', px: 0.5, py: 0.78 },
    { id: 'serdes', label: 'SerDes', category: '互联', px: 0.68, py: 0.72 },
    { id: 'health', label: '健康监测', category: '能力', px: 0.74, py: 0.38 },
    { id: 'deploy', label: '部署方案', category: '落地', px: 0.9, py: 0.5 },
  ] as const

  return specs.map(({ id, label, category, px, py }) => ({
    id,
    data: { label, category },
    style: { x: x(px), y: y(py) },
  }))
}

async function syncTechnologyGraphViewport(graph: import('@antv/g6').Graph) {
  await graph.fitView()
  const [width, height] = graph.getSize()
  const baselineZoom = graph.getZoom()
  const viewportCenter = graph.getViewportCenter()
  const { zoomMinSoft, zoomMaxSoft } = technologyGraphViewport

  technologyGraphSessions.set(graph, {
    baseline: {
      viewportCenter: [viewportCenter[0], viewportCenter[1]],
      zoom: baselineZoom,
      width,
      height,
    },
    contentBounds: computeTechnologyContentBounds(graph),
  })

  graph.setZoomRange([baselineZoom * zoomMinSoft, baselineZoom * zoomMaxSoft])
}

function TechnologyForceGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let disposed = false
    let graph: import('@antv/g6').Graph | null = null
    let resizeObserver: ResizeObserver | null = null
    let bouncingViewport = false

    const runViewportBounce = async () => {
      if (!graph || bouncingViewport) return
      const session = technologyGraphSessions.get(graph)
      if (!session) return
      const center = graph.getViewportCenter()
      const currentCenter: [number, number] = [center[0], center[1]]
      const zoom = graph.getZoom()
      const { zoomMinSoft, zoomMaxSoft, panSoft } = technologyGraphViewport
      const zoomOutsideSoft =
        zoom < session.baseline.zoom * zoomMinSoft - 0.001
        || zoom > session.baseline.zoom * zoomMaxSoft + 0.001
      const panOutsideSoft = isOutsideTechnologyViewportPan(currentCenter, session, panSoft)
      if (!panOutsideSoft && !zoomOutsideSoft) return

      bouncingViewport = true
      try {
        await bounceTechnologyGraphViewport(graph)
      } finally {
        bouncingViewport = false
      }
    }

    const mountGraph = async () => {
      const { Graph } = await import('@antv/g6')
      const container = containerRef.current
      if (!container || disposed) return

      const width = container.clientWidth || 900
      const height = container.clientHeight || 520
      const linkDistance = Math.max(220, Math.min(width * 0.16, 320))

      graph = new Graph({
        container,
        width,
        height,
        padding: [48, 72, 56, 72],
        autoFit: 'view',
        animation: false,
        data: {
          nodes: buildTechnologyGraphNodes(width, height),
          edges: technologyGraphEdges.map((edge) => ({ ...edge })),
        },
        node: {
          type: 'circle',
          style: {
            size: 12,
            fill: (datum: { data?: { category?: string } }) =>
              technologyGraphCategoryColors[datum.data?.category ?? '落地'],
            stroke: '#fff',
            lineWidth: 2,
            labelText: (datum: { data?: { label?: string } }) => datum.data?.label ?? '',
            labelFill: '#334155',
            labelPlacement: 'bottom',
            labelOffsetY: 10,
            labelFontSize: 12,
            labelFontWeight: 500,
            labelBackground: true,
            labelBackgroundFill: '#fff',
            labelBackgroundOpacity: 0.94,
            labelPadding: [2, 6],
          },
        },
        edge: {
          type: 'line',
          style: {
            stroke: '#94a3b8',
            strokeOpacity: 0.72,
            lineWidth: 1,
            endArrow: true,
          },
        },
        layout: {
          type: 'force',
          preventOverlap: true,
          nodeSize: 56,
          nodeSpacing: 40,
          collideStrength: 1,
          nodeStrength: 1400,
          edgeStrength: 80,
          linkDistance,
          gravity: 6,
          maxIteration: 500,
          animation: false,
        },
        behaviors: [
          {
            type: 'drag-element',
            key: 'drag-element',
            onFinish: (ids: string[]) => {
              if (!graph) return
              void bounceTechnologyGraphNodes(graph, ids)
            },
          },
          'click-select',
          {
            type: 'drag-canvas',
            key: 'drag-canvas',
            onFinish: () => {
              void runViewportBounce()
            },
          },
          {
            type: 'zoom-canvas',
            key: 'zoom-canvas',
            sensitivity: 0.9,
            onFinish: () => {
              void runViewportBounce()
            },
          },
        ],
      })

      try {
        await graph.render()
        if (!disposed) await syncTechnologyGraphViewport(graph)
      } catch (error: unknown) {
        if (!disposed) console.error('[EEA] Technology force graph render failed', error)
      }
    }

    void mountGraph()

    resizeObserver = new ResizeObserver(() => {
      const container = containerRef.current
      if (!container || !graph || disposed) return
      const width = container.clientWidth
      const height = container.clientHeight
      if (width <= 0 || height <= 0) return
      graph.setSize(width, height)
      void syncTechnologyGraphViewport(graph)
    })
    if (containerRef.current) resizeObserver.observe(containerRef.current)

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      graph?.destroy()
      graph = null
    }
  }, [])
  return <div ref={containerRef} className="technology-force-graph" aria-label="技术关联力导向图" />
}


export function TraceView() {
  const nodes = ['区域控制器', '智能配电', 'eFuse', '功能安全', '高压平台', 'SerDes', '中央计算', '车载芯片', '5G/6G-A通信', '功率半导体', '电源切换', '健康监测']
  return <div className="trace-radar-page"><PageHeader eyebrow="03 · 需求与功能映射" title="链路追溯" description="以雷达视图浏览研究资产之间的关联、距离与价值链分布。" action={<Space><Button icon={<FilterOutlined />}>筛选</Button><Button type="primary" icon={<CloudDownloadOutlined />}>导出链路</Button></Space>} /><div className="trace-radar-toolbar"><Input prefix={<SearchOutlined />} placeholder="搜索信号、主题或技术落脚点" /><Text type="secondary">173 个元素</Text><Space wrap><Button type="primary" ghost>◉ 分段 1</Button><Button>⌁ 距离</Button><Button>◉ 颜色</Button><Button>显示</Button></Space></div><div className="trace-radar-layout"><Card className="panel-card trace-radar-canvas"><div className="radar-canvas"><div className="radar-grid grid-one" /><div className="radar-grid grid-two" /><div className="radar-grid grid-three" /><div className="radar-axis axis-a" /><div className="radar-axis axis-b" /><div className="radar-axis axis-c" /><div className="radar-axis axis-d" /><div className="radar-core"><Text>EEA</Text><strong>研究资产</strong></div>{nodes.map((node, index) => <div key={node} className={`radar-node node-${index + 1}`}><span />{node}</div>)}<div className="radar-sector sector-one">创造端</div><div className="radar-sector sector-two">传递端</div><div className="radar-sector sector-three">兑现端</div><div className="radar-sector sector-four">规制端</div></div></Card><Card className="panel-card trace-filter-panel" title="全局筛选"><Text strong>状态</Text><Select defaultValue="已发布" style={{ width: '100%', marginTop: 8 }} options={['已发布','待验收','已归档'].map((value) => ({ value, label: value }))} /><Divider /><Text strong>资产类型</Text><div className="filter-chip-list"><Tag color="blue">信号 94</Tag><Tag color="purple">主题 18</Tag><Tag color="green">需求点 36</Tag><Tag color="orange">技术落脚点 41</Tag></div><Divider /><Text strong>价值链阶段</Text><div className="filter-options">{['创造端','传递端','兑现端','规制端'].map((value) => <Checkbox key={value} defaultChecked>{value}</Checkbox>)}</div><Divider /><Text type="secondary">点击雷达节点查看关联证据与推导链。</Text></Card></div><Row gutter={18} className="trace-summary-row"><Col xs={24} lg={16}><Card className="panel-card" title="当前选中资产"><Title level={4}>低压系统智能化</Title><Text type="secondary">16 条来源 · 8 条已验证信号 · 12 个关联技术标签</Text><Divider /><Space wrap><Tag color="cyan">智能配电</Tag><Tag color="green">区域控制器</Tag><Tag color="purple">功能安全</Tag><Button type="link">查看推导链</Button></Space></Card></Col><Col xs={24} lg={8}><Card className="panel-card" title="关联健康度"><Progress type="dashboard" percent={82} strokeColor="#2563eb" /><Text type="secondary">证据完整度高于平台平均 9%</Text></Card></Col></Row></div>
}

export function TechnologyView() {
  const { data: panoramaStages } = usePanoramaStages()
  const stages = panoramaStages?.length
    ? panoramaStages
    : [{ stage_label: '创造端', demand_count: 1, demand_points: [] }, { stage_label: '传递端', demand_count: 1, demand_points: [] }, { stage_label: '规制端', demand_count: 0, demand_points: [] }]
  return <><PageHeader eyebrow="04 · 功能与技术拆解" title="技术全景图" description="按价值链环节展开需求点、车辆功能与技术落脚点，建立技术地图。" action={<Button type="primary" icon={<PlusOutlined />}>新增落脚点</Button>} /><Card className="panel-card linked-graph-card technology-graph-card" title="技术关联网络" extra={<Space><Tag color="blue">9 个节点</Tag><Tag color="green">22 条连接</Tag></Space>}><TechnologyForceGraph /></Card><div className="panorama-grid">{stages.map((stage, index) => <Card className="panel-card panorama-column" key={stage.stage_label} title={<span><span className="stage-marker" />{stage.stage_label}</span>} extra={<Tag>{stage.demand_count} 个需求</Tag>}><Text type="secondary">{index === 0 ? '供应链与器件能力' : index === 1 ? '主机厂与系统集成' : '行业标准与规定'}</Text>{stage.demand_points.flatMap((dp) => dp.functions.flatMap((fn) => fn.landing_points.map((lp) => ({ ...lp, role: fn.name })))).slice(0, 2).map((item) => <div className="landing-card" key={item.id}><div className="landing-head"><Text strong>{item.name}</Text><Tag color="blue">{item.domain_name}</Tag></div><Text type="secondary">{item.role ?? '—'}</Text><div className="landing-footer"><span>{item.standard_count} 个部署标准</span><Button type="link">打开</Button></div></div>)}{!stage.demand_points.length && landingPoints.slice(index, index + 1).map((item) => <div className="landing-card" key={item.key}><div className="landing-head"><Text strong>{item.name}</Text><Tag color="blue">{item.domain}</Tag></div><Text type="secondary">{item.role}</Text><div className="landing-footer"><span>{item.standards} 个部署标准</span><Button type="link">打开</Button></div></div>)}</Card>)}</div></>
}

function TrafficFlowGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let cleanup = () => {}
    void import('@antv/g2').then(({ Chart }) => {
      if (!containerRef.current) return
      const chart = new Chart({ container: containerRef.current, autoFit: false, width: 940, height: 360, padding: 28 })
      cleanup = () => { void chart.destroy() }
    chart.options({
      type: 'sankey',
      data: { value: [
        { source: '资格筛选', target: '讨论', value: 158 },
        { source: '讨论', target: '评估', value: 123 },
        { source: '评估', target: '入选', value: 80 },
        { source: '入选', target: '项目', value: 23 },
        { source: '项目', target: '已落地', value: 8 },
        { source: '资格筛选', target: '归档', value: 37 },
        { source: '讨论', target: '归档', value: 35 },
        { source: '评估', target: '归档', value: 43 },
        { source: '入选', target: '归档', value: 57 },
        { source: '项目', target: '归档', value: 15 },
      ] },
      layout: { nodeAlign: 'justify', nodePadding: 0.035, nodeSort: null },
      scale: { color: { range: ['#2392e9', '#7ab53d', '#673ab7', '#f59e0b', '#0891b2', '#64748b'] } },
      style: { nodeFillOpacity: 0.92, linkFillOpacity: 0.22, labelFontSize: 12, labelFill: '#334155' },
      interaction: { tooltip: true },
    })
      void chart.render()
    })
    return () => cleanup()
  }, [])
  return <div ref={containerRef} className="traffic-flow-graph sankey-flow-graph" aria-label="创新进展桑基图" />
}

export function StrategyView() {
  const [period, setPeriod] = useState('上季度')
  const [focusedStage, setFocusedStage] = useState<string | null>(null)
  const { rows: landingRows } = useLandingRows()
  const tableRows = landingRows.length ? landingRows : landingPoints
  const stages = [{ label: '资格筛选', value: '248', rate: '100%', segments: [{ value: '70%', color: 'blue' }, { value: '15%', color: 'green' }, { value: '15%', color: 'purple' }] }, { label: '讨论', value: '158', rate: '79%', segments: [{ value: '75%', color: 'blue' }, { value: '10%', color: 'green' }, { value: '15%', color: 'purple' }] }, { label: '评估', value: '123', rate: '65%', segments: [{ value: '75%', color: 'blue' }, { value: '10%', color: 'green' }, { value: '15%', color: 'purple' }] }, { label: '入选', value: '80', rate: '32%', segments: [{ value: '82%', color: 'blue' }, { value: '8%', color: 'green' }, { value: '10%', color: 'purple' }] }, { label: '项目', value: '23', rate: '9%', segments: [{ value: '83%', color: 'blue' }, { value: '8%', color: 'green' }] }, { label: '已落地', value: '8', rate: '3%', segments: [{ value: '80%', color: 'blue' }, { value: '20%', color: 'purple' }] }]
  useEffect(() => {
    const readStageFocus = () => {
      const params = new URLSearchParams(window.location.search)
      const funnel = params.get('funnel')
      const hashStage = window.location.hash.replace(/^#stage-/, '')
      const next = funnel ?? (window.location.hash.startsWith('#stage-') ? hashStage : null)
      setFocusedStage(next)
      if (next) {
        requestAnimationFrame(() => {
          document.getElementById(`strategy-stage-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
      }
    }
    readStageFocus()
    window.addEventListener('popstate', readStageFocus)
    window.addEventListener('hashchange', readStageFocus)
    return () => {
      window.removeEventListener('popstate', readStageFocus)
      window.removeEventListener('hashchange', readStageFocus)
    }
  }, [])
  return <div className="analyst-funnel-page"><PageHeader eyebrow="05 · 战略研判" title="创新组合" description="从研究信号到落地项目，按阶段查看技术机会的转化效率与组合表现。" action={<Button type="primary" icon={<PlusOutlined />}>发起研判</Button>} />{focusedStage && strategyStageLabels[focusedStage] ? <Tag className="strategy-stage-focus" color="blue" id={`strategy-stage-${focusedStage}`}>当前聚焦：{strategyStageLabels[focusedStage]}</Tag> : null}<div className="funnel-periods">{['本季度', '上季度', '今年', '去年', '全部'].map((item) => <Button key={item} type={period === item ? 'primary' : 'default'} shape="round" onClick={() => setPeriod(item)}>{item}</Button>)}</div><Row gutter={[16,16]} className="summary-row funnel-metrics"><Col xs={24} sm={12} lg={6}><Card><Statistic title="组合价值" value={132200456} prefix="$" /></Card></Col><Col xs={24} sm={12} lg={6}><Card><Statistic title="新增想法" value={832} suffix={<span className="funnel-delta">▲ 5%</span>} /></Card></Col><Col xs={24} sm={12} lg={6}><Card><Statistic title="新增项目" value={34} suffix={<span className="funnel-delta">▲ 3%</span>} /></Card></Col><Col xs={24} sm={12} lg={6}><Card><Statistic title="识别企业" value={28} suffix={<span className="funnel-delta">▲ 4%</span>} /></Card></Col></Row><Card className="panel-card analyst-funnel-card" title="创新进展" extra={<Space wrap><Tag color="green">● 进行中</Tag><Tag color="blue">● 已转交</Tag><Tag color="purple">● 已归档</Tag></Space>}><TrafficFlowGraph /><div className="funnel-stage-labels"><Text>研究池</Text><Text>讨论池</Text><Text>评估池</Text><Text>选择池</Text><Text>项目池</Text><Text>落地池</Text></div></Card><Card className="panel-card view-card" title="高潜方向" extra={<Button type="link">查看全部</Button>}><Table pagination={false} dataSource={tableRows.slice(0, 4)} columns={[{ title: '技术落脚点', dataIndex: 'name' }, { title: '业务匹配', render: () => <Progress percent={92} size="small" showInfo={false} /> }, { title: '综合分', dataIndex: 'score', render: (value: number) => <Text strong>{value} / 25</Text> }, { title: '策略分类', dataIndex: 'category', render: (value: string) => <Tag color={value === '短期可落地' ? 'green' : 'blue'}>{value}</Tag> }]} /></Card></div>
}

function DeductionChainWorkspace() {
  return <div className="deduction-workspace"><Card className="panel-card deduction-card deduction-radar-card" title="推导链雷达视图" extra={<Text type="secondary">价值链 · 距离</Text>}><DeductionChainRadar /></Card><Row gutter={[18, 18]}><Col xs={24} lg={15}><Card className="panel-card" title="推导说明"><Timeline items={[{ color: 'blue', content: '从原始网页提取 48V 供电网络、区域控制器和混合供电信息。' }, { color: 'green', content: '与同主题来源进行交叉验证，确认区域化供电趋势。' }, { color: 'purple', content: '映射至低压系统智能化主题和主动配电需求点。' }, { color: 'orange', content: '建议下一步补录功率半导体健康监测相关证据。' }]} /></Card></Col><Col xs={24} lg={9}><Card className="panel-card" title="链路摘要"><Statistic title="链路置信度" value={94} suffix="%" styles={{ content: { color: '#2563eb' } }} /><Divider /><Text type="secondary">5 个推导节点 · 12 条关联信号 · 3 个待验证假设</Text></Card></Col></Row></div>
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
  const signal =
    liveSignal ??
    (isUuid(signalId) ? null : signals.find((item) => item.key === signalId) ?? null)
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
  return <ProCard className="page-placeholder" bordered={false} boxShadow><div className="placeholder-icon"><SettingOutlined /></div><Title level={3}>{config.title}</Title><Text type="secondary">{config.description}</Text><Tag color="blue">页面骨架已就绪</Tag><Text type="secondary">该模块将在研究流程完成后接入真实数据与交互。</Text></ProCard>
}

export function UtilityView({ page, onNavigate, signalId }: { page: keyof typeof utilityPages; onNavigate: NavigateFn; signalId: string }) {
  const { message: messageApi } = AntApp.useApp()
  const config = utilityPages[page]
  const isImport = page === 'newSignal'
  const isCreateTopic = page === 'createTopic'
  const isReport = page === 'report'
  const isKnowledge = page === 'knowledge'
  const isDetail = page === 'singal' || page === 'traceDetail'
  const submit = () => messageApi.success(isImport ? '已加入解析队列，MarkItDown 将生成 Markdown 证据' : `${config.action}成功`)
  const uploadProps = { multiple: true, beforeUpload: () => false, onChange: ({ fileList }: { fileList: unknown[] }) => fileList.length && messageApi.info(`已选择 ${fileList.length} 个文件`) }
  if (page === 'traceDetail') {
    const exportDeductionChain = () => messageApi.success('推导链导出任务已创建')
    return (
      <>
        <PageHeader
          eyebrow={config.eyebrow}
          title={config.title}
          description={config.description}
          action={
            <Space>
              <Button onClick={() => onNavigate(`singal/${signalId}`)}>返回证据</Button>
              <Button type="primary" icon={config.icon} onClick={exportDeductionChain}>{config.action}</Button>
            </Space>
          }
        />
        <DeductionChainWorkspace />
      </>
    )
  }
  if (page === 'singal') {
    return <EvidenceDetailWorkspace onNavigate={onNavigate} signalId={signalId} />
  }
  if (page === 'workflow') return <WorkflowStudio />
  if (page === 'profile') {
    return (
      <ProfilePage
        config={config}
        onNavigate={(target) => onNavigate(typeof target === 'string' ? target : target.view)}
      />
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
        <PageHeader
          eyebrow={config.eyebrow}
          title={config.title}
          description={config.description}
          action={<Button type="primary" icon={config.icon} onClick={submit}>{config.action}</Button>}
        />
        <PlaceholderView config={config} />
      </>
    )
  }
  return <>
    <PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} action={<Button type="primary" icon={config.icon} onClick={submit}>{config.action}</Button>} />
    {isImport ? (
      <NewSignalImportPage onNavigate={onNavigate} />
    ) : isReport ? <Card className="panel-card" title="PDF 报告模板"><Space orientation="vertical" size={16} style={{ width: '100%' }}><Select size="large" defaultValue="executive" options={[{ value: 'executive', label: '管理层摘要 · 6 页' }, { value: 'research', label: '完整研究报告 · 18 页' }, { value: 'evidence', label: '证据链附录 · 32 页' }]} /><Select mode="multiple" placeholder="选择章节" defaultValue={['signals','themes','strategy']} options={[{ value: 'signals', label: '信号与证据' }, { value: 'themes', label: '主题与需求点' }, { value: 'strategy', label: '战略研判' }, { value: 'trace', label: '链路追溯' }]} /><Button type="primary" icon={<FilePdfOutlined />} onClick={submit}>生成 PDF 预览</Button></Space></Card> : isDetail ? <Row gutter={[18, 18]}><Col xs={24} lg={16}><Card className="panel-card" title="原始证据与解析结果"><Space orientation="vertical" size={14} style={{ width: '100%' }}><div className="evidence-preview">原始 PDF / 图片预览区域</div><Input.TextArea rows={10} defaultValue="# Parsed evidence\n\nMarkItDown generated Markdown will appear here.\n\n- 来源：汽车电子观察\n- 标签：区域控制器、智能配电\n- 置信度：0.94" /><Button onClick={() => onNavigate('traceDetail')}>进入链路追溯</Button></Space></Card></Col><Col xs={24} lg={8}><Card className="panel-card" title="研究助手"><Input.TextArea rows={8} placeholder="询问这条证据，后续接入 PydanticAI" /><Button type="primary" block onClick={() => messageApi.info('已记录问题，等待研究助手接入')}>发送问题</Button></Card></Col></Row> : <><Row gutter={[18, 18]}><Col xs={24} lg={16}><Card className="panel-card" title="工作区操作"><Space orientation="vertical" size={16} style={{ width: '100%' }}><Input prefix={<SearchOutlined />} placeholder="输入关键词、主题或标签" size="large" /><Input.TextArea rows={5} placeholder="补充研究说明、摘要或筛选条件" /><Space><Button type="primary" icon={config.icon} onClick={submit}>{config.action}</Button><Button onClick={() => onNavigate('overview')}>返回总览</Button></Space></Space></Card></Col><Col xs={24} lg={8}><Card className="panel-card" title="模拟数据状态"><Statistic title="已加载记录" value={page === 'search' ? 28 : 12} /><Divider /><Text type="secondary">当前使用演示数据，后续可替换为 GraphQL 查询与会话接口。</Text></Card></Col></Row><Card className="panel-card view-card" title="最近记录"><Table pagination={false} dataSource={signals.slice(0, 3)} columns={[{ title: '名称', dataIndex: 'title' }, { title: '状态', dataIndex: 'status', render: (value: string) => <Tag color={statusColors[value]}>{value}</Tag> }, { title: '更新时间', dataIndex: 'date' }, { title: '操作', render: () => <Button type="link" onClick={() => onNavigate(`singal/${signalId}`)}>查看详情</Button> }]} /></Card></>}
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
  const { data: overview, isSuccess: overviewReady } = useOverviewStats()
  const {
    rows: cachedSignals,
    isLoading: signalsLoading,
    usingMock,
  } = useSignalsWithFallback({ query, stageChip: stage })
  const { rows: themeRows } = useThemeRows()
  const { rows: demandRows } = useDemandRows()
  const { rows: landingRows } = useLandingRows()

  const funnelSteps = useMemo(
    () => (overview ? overviewToFunnelSteps(overview) : overviewFunnelSteps),
    [overview],
  )
  const traceMetrics = useMemo(
    () => (overview ? overviewToTraceMetrics(overview) : overviewTraceMetrics),
    [overview],
  )
  const overviewThemes: OverviewThemeRow[] = themeRows.length
    ? themeRows
    : overviewReady
      ? []
      : themes.map((theme) => ({
        id: theme.name,
        name: theme.name,
        note: theme.note,
        count: theme.count,
        sources: theme.sources,
        progress: theme.progress,
        color: theme.color,
      }))

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
      if (pathnameParts[1]) setActiveSignalId(pathnameParts[1])
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
    if (id) setActiveSignalId(id)
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

  const showTrendDelta = Boolean(overviewReady && overview && overview.signals > 0)

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
  const evidenceMockSignal =
    isEvidenceStudio && !isUuid(activeSignalId)
      ? signals.find((item) => item.key === activeSignalId) ?? null
      : null
  const evidencePageTitle = isEvidenceStudio
    ? evidenceBarSignal?.title ??
      evidenceMockSignal?.title ??
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
              {activeMenu === 'trace' && <TraceView />}
              {activeMenu === 'technology' && <TechnologyView />}
              {activeMenu === 'strategy' && <StrategyView />}
              {utilityPages[activeMenu] && <UtilityView page={activeMenu as keyof typeof utilityPages} onNavigate={navigate} signalId={activeSignalId} />}
            </div>
            ) : (
            <div className="content-wrap">
              {usingMock ? (
                <Alert type="warning" showIcon title="演示数据" description="无法连接 API，部分总览指标可能为离线演示值。" style={{ marginBottom: 16 }} />
              ) : null}
              <div className="welcome-row"><div><Title level={2}>早上好，刘文 <span className="wave">✦</span></Title><Text type="secondary">这里是 EEA 前瞻技术扫描平台的最新研究进展。</Text></div><Space><Button icon={<CloudDownloadOutlined />} onClick={() => navigate('report')}>导出报告</Button><Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('newSignal')}>新增信号</Button></Space></div>
              <Row gutter={[16, 16]} className="overview-metrics">
                <Col xs={24} sm={12} xl={6}>
                  <Card variant="borderless" className="panel-card metric-tile">
                    <Statistic
                      title={<span><RadarChartOutlined /> 信号总数</span>}
                      value={overviewReady ? (overview?.signals ?? 0) : cachedSignals.length}
                      suffix={showTrendDelta ? <span className="stat-delta">+18.4%</span> : undefined}
                    />
                    <div className="sparkline blue" role="group" aria-label="近九周信号入库趋势">
                      {signalTrendBars.map((bar) => (
                        <button
                          key={bar.week}
                          type="button"
                          className={`sparkline-bar${bar.emphasis ? ' is-peak' : ''}`}
                          style={{ height: `${bar.heightPercent}%` }}
                          aria-label={`第 ${bar.week} 周信号趋势`}
                          onClick={() => navigateTo({ view: 'signals', query: { trend: `w${bar.week}` }, hash: `week-${bar.week}` })}
                        />
                      ))}
                    </div>
                    <Text type="secondary">较上月新增 38 条 · 点击柱形查看对应周次</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Card variant="borderless" className="panel-card metric-tile">
                    <Statistic title={<span><TagsOutlined /> 技术主题</span>} value={overview?.tech_themes ?? themeRows.length} suffix={<span className="stat-delta teal">+4</span>} />
                    <Progress percent={68} showInfo={false} strokeColor="#0f766e" railColor="#e6f4f1" />
                    <Text type="secondary">21 个主题已完成交叉验证</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Card variant="borderless" className="panel-card metric-tile">
                    <Statistic title={<span><FundProjectionScreenOutlined /> 需求点</span>} value={overview?.demand_points ?? demandRows.length} suffix={<span className="stat-delta amber">+3</span>} />
                    <div className="mini-bars"><i style={{ height: '36%' }} /><i style={{ height: '58%' }} /><i style={{ height: '48%' }} /><i style={{ height: '75%' }} /><i style={{ height: '66%' }} /><i style={{ height: '92%' }} /></div>
                    <Text type="secondary">6 个需求点待人工复核</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Card variant="borderless" className="panel-card metric-tile">
                    <Statistic title={<span><BulbOutlined /> 战略研判</span>} value={overview?.funnel_pool ?? landingRows.filter((r) => r.score > 0).length} suffix="项" />
                    <div className="assessment-line"><span><i className="legend-dot blue-dot" />前瞻布局</span><span>5</span></div>
                    <div className="assessment-line"><span><i className="legend-dot green-dot" />短期可落地</span><span>4</span></div>
                    <div className="assessment-line"><span><i className="legend-dot orange-dot" />生态合作</span><span>3</span></div>
                  </Card>
                </Col>
              </Row>
              <Row gutter={[18, 18]} className="main-grid"><Col xs={24} lg={15}><Card variant="borderless" className="panel-card" title={<div><Title level={4}>技术主题动态</Title><Text type="secondary">跨来源信号聚合与需求点演进</Text></div>} extra={<Button type="link" onClick={() => navigate('topics')}>查看全部 <ArrowRightOutlined /></Button>}>{overviewThemes.length ? <div className="theme-list">{overviewThemes.map((theme) => <div className="theme-row clickable-row" key={theme.id} role="button" tabIndex={0} onClick={() => navigate('topics')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') navigate('topics') }}><div className="theme-icon" style={{ background: `${theme.color}14`, color: theme.color }}><RadarChartOutlined /></div><div className="theme-info"><div className="theme-name"><Text strong>{theme.name}</Text><Tag color={theme.progress > 75 ? 'blue' : theme.progress > 60 ? 'cyan' : 'orange'}>{theme.progress > 75 ? '高热度' : '持续观察'}</Tag></div><Text type="secondary">{theme.note}</Text><Progress percent={theme.progress} showInfo={false} strokeColor={theme.color} railColor="#eef2f6" size="small" /></div><div className="theme-count"><Text strong>{theme.count}</Text><Text type="secondary">信号</Text><Text className="source-count">{theme.sources} 来源</Text></div><ArrowRightOutlined className="row-arrow" /></div>)}</div> : <PlatformEmptyState title="暂无技术主题" description="信号完成标签与归集后将在此展示主题动态。" action={<Button type="link" onClick={() => navigate('topics')}>打开主题工作台</Button>} />}</Card></Col><Col xs={24} lg={9}><Card variant="borderless" className="panel-card funnel-card" title={<div><Title level={4}>战略研判漏斗</Title><Text type="secondary">四步筛选与价值评估</Text></div>} extra={<Button type="text" icon={<MoreOutlined />} aria-label="打开战略研判" onClick={() => navigate('strategy')} />}><StrategyFunnelCard onNavigate={navigateTo} steps={funnelSteps} /></Card></Col></Row>
              <Card className="panel-card view-card signals-panel" title="最新信号" extra={<Space wrap><Input allowClear prefix={<SearchOutlined />} placeholder="搜索标题、发布主体或标签" value={query} onChange={(e) => setQuery(e.target.value)} /><Select value={stage} onChange={setStage} options={['全部环节', '创造端', '传递端', '兑现端', '规制端'].map((item) => ({ label: item, value: item }))} suffixIcon={<FilterOutlined />} className="stage-select" /><Button type="link" onClick={() => navigate('signals')}>打开证据库 <ArrowRightOutlined /></Button></Space>}><Table rowKey="key" loading={signalsLoading} columns={signalTableColumns} dataSource={filteredSignals} pagination={{ pageSize: 6 }} scroll={{ x: 960 }} locale={signalsTableLocale(() => navigate('newSignal'))} /></Card>
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
                <Row gutter={[16, 16]} align="middle">
                  {traceMetrics.map((metric) => (
                    <Col key={metric.label} xs={12} sm={6}>
                      <Statistic title={metric.label} value={metric.value} />
                    </Col>
                  ))}
                </Row>
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
