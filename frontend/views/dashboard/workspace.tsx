'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { PlatformLayout } from '@/components/layout/platform-layout'
import { PageHeader } from '@/components/shared/page-header'
import { QueryFailure } from '@/components/shared/query-failure'
import { SignalsView } from '@/views/signals'
import { TraceView } from '@/views/trace'
import { DeductionChainWorkspace } from '@/views/trace/deduction-chain-workspace'
import { TechnologyView } from '@/views/technology'
import { StrategyView } from '@/views/strategy'
import { isMainMenuRoute } from '@/config/menu'
import { utilityPages } from '@/config/utility-pages'
import { ALL_VIEW_KEYS } from '@/config/routes'
import {
  useOverviewStats,
  useSignalDetail,
  useSignalsListFiltered,
  useThemeRows,
  useRefCodeMaps,
  eeaQueryKeys,
} from '@/hooks/use-eea-queries'
import {
  overviewToFunnelSteps,
  overviewToTraceMetrics,
  strategyFunnelToFunnelSteps,
  formatApiDate,
} from '@/lib/eea-mappers'
import { StrategyFunnelCard } from '@/components/overview/strategy-funnel-card'
import { PanoramaImportBanner } from '@/components/import/panorama-import-banner'
import { NotificationsCenter } from '@/components/notifications/notifications-center'
import { usePlatformNotifications } from '@/hooks/use-platform-notifications'
import { isUuid } from '@/lib/api/api-errors'
import { EeaApiError, signalArchiveUrl, documentCanonicalUrl } from '@/lib/api/client'
import {
  DocumentDeckPreviewLazy,
  DocumentPdfViewerLazy,
} from '@/components/evidence/document-stage-preview'
import { documentStagePreviewMode } from '@/lib/document-preview'
import { fetchDocument, patchSignal } from '@/lib/api/eea-api'
import { buildAppPath } from '@/lib/navigation'
import { excerptLooksLikeChrome, sourceExcerptSnippet } from '@/lib/evidence/audio-overview-segments'
import type { AppRouteOptions, NavigateFn, Signal } from '@/types/platform'
import type { StudioInfographicPayload, StudioMindmapPayload } from '@/lib/api/types'
import {
  clearStudioKind,
  loadStudioCache,
  persistStudioKind,
  type StudioCacheEntry,
} from '@/lib/studio-cache'
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
import { useSignalTablePagination } from '@/lib/signal-table-pagination'
import { QuerySurface } from '@/components/shared/query-surface'
import { useEeaDataSync } from '@/hooks/use-eea-data-sync'
import { useShellColorScheme } from '@/hooks/use-shell-color-scheme'
import { querySurfaceState } from '@/hooks/use-query-surface'
import { NewSignalImportPage } from '@/components/import/new-signal-import'
import { WorkflowStudio } from '@/components/workflow-studio'
import { PlatformSettingsPage } from '@/views/utility/platform-settings-page'
import { ProfilePage } from '@/views/utility/profile-page'
import { ArchivedSignalsView } from '@/views/evidence/archived-signals-view'
import {
  buildSignalTableColumns,
  SignalRowActions,
  SignalStatusTag,
} from '@/features/evidence/signal-columns'

const { Text, Title, Paragraph } = Typography

export { SignalRowActions }

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
                <SignalStatusTag status={signal.status} />
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

type EvidenceStageView =
  | 'archive'
  | 'preview'
  | 'markdown'
  | 'assistant'
  | 'mindmap'
  | 'report'
  | 'infographic'

function EvidenceDetailWorkspace({ onNavigate, signalId }: { onNavigate: (key: string) => void; signalId: string }) {
  const [sourceOpen, setSourceOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [stageView, setStageView] = useState<EvidenceStageView>('markdown')
  const [bodyText, setBodyText] = useState<string | null>(null)
  const [canonicalMd, setCanonicalMd] = useState<string | null>(null)
  const [archiveFrameLoaded, setArchiveFrameLoaded] = useState(false)
  const [figureByIndex, setFigureByIndex] = useState<Record<number, string>>({})
  const [studioCacheBySignal, setStudioCacheBySignal] = useState<Record<string, StudioCacheEntry>>({})
  const markdownArticleRef = useRef<HTMLElement>(null)
  const { signal: liveSignal, detail, isLoading, isError } = useSignalDetail(signalId)
  const { maps } = useRefCodeMaps()
  const apiId = detail?.id ?? (isUuid(signalId) ? signalId : null)
  const documentId = detail?.document_id ?? null
  const documentQuery = useQuery({
    queryKey: ['eea', 'document', documentId ?? 'none'] as const,
    queryFn: () => fetchDocument(documentId!),
    enabled: Boolean(documentId),
    staleTime: 60_000,
  })
  const documentMeta = documentQuery.data
  const documentPreviewMode = documentMeta
    ? documentStagePreviewMode(documentMeta.filename, documentMeta.mime)
    : null
  const showPreviewTab = Boolean(documentId && documentMeta && documentPreviewMode)
  const documentPreviewPending = Boolean(documentId && (documentQuery.isLoading || documentQuery.isFetching))
  const signal = liveSignal
  const statusTag = signal?.status === '已留存' ? 'green' : signal?.status === '待人工复核' ? 'warning' : 'default'
  const hasArchive = Boolean(detail?.snapshot_html_object_key)
  const isDocumentSource = Boolean(documentId)
  const coreStageViews = useMemo((): EvidenceStageView[] => {
    if (showPreviewTab) return ['preview', 'markdown', 'assistant']
    if (hasArchive) return ['archive', 'markdown', 'assistant']
    return ['markdown', 'assistant']
  }, [showPreviewTab, hasArchive])
  const linkedDemands = detail?.linked_demand_points ?? []
  const hasBody = Boolean(
    detail?.body_object_key || bodyText || detail?.excerpt || (isDocumentSource && canonicalMd),
  )
  const markdownSource =
    (isDocumentSource && canonicalMd) || bodyText || detail?.excerpt || signal?.title || ''
  const studioCacheKey = apiId ?? signal?.key ?? signalId
  const studioCache = studioCacheBySignal[studioCacheKey] ?? {}

  useEffect(() => {
    if (!studioCacheKey || !isUuid(studioCacheKey)) return
    const persisted = loadStudioCache(studioCacheKey)
    if (!persisted.mindmap && !persisted.report && !persisted.infographic) return
    setStudioCacheBySignal((prev) => ({
      ...prev,
      [studioCacheKey]: { ...persisted, ...prev[studioCacheKey] },
    }))
  }, [studioCacheKey])

  const rememberStudioResult = useCallback(
    (kind: keyof StudioCacheEntry, payload: StudioCacheEntry[keyof StudioCacheEntry]) => {
      if (isUuid(studioCacheKey)) {
        persistStudioKind(studioCacheKey, kind, payload as StudioCacheEntry[typeof kind])
      }
      setStudioCacheBySignal((prev) => ({
        ...prev,
        [studioCacheKey]: { ...prev[studioCacheKey], [kind]: payload },
      }))
    },
    [studioCacheKey],
  )

  const forgetStudioResult = useCallback(
    (kind: keyof StudioCacheEntry) => {
      if (isUuid(studioCacheKey)) {
        clearStudioKind(studioCacheKey, kind)
      }
      setStudioCacheBySignal((prev) => {
        const entry = { ...prev[studioCacheKey] }
        delete entry[kind]
        return { ...prev, [studioCacheKey]: entry }
      })
    },
    [studioCacheKey],
  )

  const displayTitle = useMemo(() => {
    const t = signal?.title?.trim() ?? ''
    const cleaned = t.replace(/^(新闻详情|文章详情|详情页?)[\-–—]\s*/, '').trim()
    return cleaned || t
  }, [signal?.title])

  const sourceSummaryPlain = useMemo(() => {
    const stored = detail?.excerpt?.trim()
    if (stored && !excerptLooksLikeChrome(stored)) {
      return stored.length <= 320 ? stored : `${stored.slice(0, 319)}…`
    }
    const raw = (bodyText ?? stored ?? '').trim()
    if (!raw) return null
    return sourceExcerptSnippet(raw, displayTitle, 320)
  }, [bodyText, detail?.excerpt, displayTitle])

  const evidenceStageAutoKey = useMemo(
    () =>
      [
        signalId,
        showPreviewTab ? '1' : '0',
        documentPreviewMode ?? '',
        hasArchive ? '1' : '0',
        hasBody ? '1' : '0',
        documentPreviewPending ? '1' : '0',
        detail?.body_object_key ?? '',
        detail?.excerpt ?? '',
      ].join('\0'),
    [
      signalId,
      showPreviewTab,
      documentPreviewMode,
      hasArchive,
      hasBody,
      documentPreviewPending,
      detail?.body_object_key,
      detail?.excerpt,
    ],
  )

  useEffect(() => {
    if (documentPreviewPending) {
      if (hasBody) setStageView('markdown')
      return
    }
    if (showPreviewTab) setStageView('preview')
    else if (hasArchive) setStageView('archive')
    else if (detail?.body_object_key || detail?.excerpt) setStageView('markdown')
    else setStageView('assistant')
  }, [
    evidenceStageAutoKey,
    documentPreviewPending,
    hasBody,
    showPreviewTab,
    hasArchive,
    detail?.body_object_key,
    detail?.excerpt,
  ])

  useEffect(() => {
    if (!detail?.document_id) {
      setCanonicalMd(null)
      return
    }
    let cancelled = false
    import('@/lib/api/eea-api').then(({ fetchDocumentCanonicalMd }) =>
      fetchDocumentCanonicalMd(detail.document_id!)
        .then((text) => {
          if (!cancelled) setCanonicalMd(text)
        })
        .catch(() => {
          if (!cancelled) setCanonicalMd(null)
        }),
    )
    return () => {
      cancelled = true
    }
  }, [detail?.document_id])

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
    setArchiveFrameLoaded(false)
  }, [apiId, stageView])

  useEffect(() => {
    if (!hasBody || !apiId) {
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
  }, [hasBody, apiId, signalId])

  const stageTabOptions: { label: string; value: EvidenceStageView; disabled?: boolean }[] = useMemo(
    () => [
      ...(showPreviewTab ? [{ label: '预览', value: 'preview' as const }] : []),
      ...(!showPreviewTab ? [{ label: '来源留存', value: 'archive' as const, disabled: !hasArchive }] : []),
      { label: '解析快照', value: 'markdown', disabled: !hasBody },
      { label: '研究助手', value: 'assistant' },
    ],
    [showPreviewTab, hasArchive, hasBody],
  )

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

  const onStageTabChange = (value: EvidenceStageView) => {
    if (value === 'assistant') {
      setPreviewOpen(true)
    }
    setStageView(value)
  }

  const segmentedValue = coreStageViews.includes(stageView) ? stageView : undefined

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
                updatedAt={detail?.updated_at ?? null}
              />
              <Divider />
              <SignalTagsEditor
                signalId={apiId}
                tags={signal.tags}
                updatedAt={detail?.updated_at ?? null}
              />
              <Divider />
              <SignalCorrectionAudit signalId={apiId} />
              <Divider />
              <SignalThemeAssign
                signalId={apiId}
                themeId={detail?.tech_theme_id ?? detail?.theme?.id ?? null}
                themeName={detail?.theme?.working_name ?? null}
                isDocumentSource={isDocumentSource}
                updatedAt={detail?.updated_at ?? null}
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
          <div className={`evidence-stage-tab-pane${stageView === 'preview' ? ' is-active' : ''}`}>
            {documentId && documentPreviewMode === 'deck' ? (
              <DocumentDeckPreviewLazy documentId={documentId} />
            ) : documentId && documentPreviewMode === 'pdf' ? (
              <DocumentPdfViewerLazy documentId={documentId} filename={documentQuery.data?.filename} />
            ) : (
              <PlatformEmptyState
                title="无法预览文档"
                description="该信号未关联可预览的 PDF、Office 或 PPTX 文档。"
              />
            )}
          </div>
          <div className={`evidence-stage-tab-pane${stageView === 'archive' ? ' is-active' : ''}`}>
            {hasArchive && apiId ? (
              <>
                {!archiveFrameLoaded ? (
                  <div className="evidence-archive-frame-loading">
                    <Spin description="加载归档网页…" />
                  </div>
                ) : null}
                <iframe
                  title="HTML 归档回放"
                  className="evidence-archive-frame-full"
                  sandbox="allow-same-origin"
                  referrerPolicy="no-referrer"
                  src={signalArchiveUrl(apiId)}
                  onLoad={() => setArchiveFrameLoaded(true)}
                />
              </>
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
              fetchEnabled={stageView === 'mindmap'}
              cached={studioCache.mindmap}
              onLoaded={(payload) => rememberStudioResult('mindmap', payload as StudioMindmapPayload)}
              onInvalidate={() => forgetStudioResult('mindmap')}
            />
          </div>
          <div className={`evidence-stage-tab-pane${stageView === 'report' ? ' is-active' : ''}`}>
            <EvidenceStudioPane
              signalId={apiId}
              kind="report"
              fetchEnabled={stageView === 'report'}
              cached={studioCache.report}
              onLoaded={(payload) => rememberStudioResult('report', payload as string)}
              onInvalidate={() => forgetStudioResult('report')}
            />
          </div>
          <div className={`evidence-stage-tab-pane${stageView === 'infographic' ? ' is-active' : ''}`}>
            <EvidenceStudioPane
              signalId={apiId}
              kind="infographic"
              fetchEnabled={stageView === 'infographic'}
              cached={studioCache.infographic}
              onLoaded={(payload) => rememberStudioResult('infographic', payload as StudioInfographicPayload)}
              onInvalidate={() => forgetStudioResult('infographic')}
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
  if (page === 'notifications') {
    return (
      <>
        <PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} />
        <NotificationsCenter />
      </>
    )
  }
  if (isReport || page === 'search') {
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
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [layoutReady, setLayoutReady] = useState(true)
  const [activeMenu, setActiveMenu] = useState(initialView)
  const [activeSignalId, setActiveSignalId] = useState(signalId)
  const [signalPreview, setSignalPreview] = useState<Signal | null>(null)
  const [query, setQuery] = useState('')
  const [themeFilter, setThemeFilter] = useState<string | undefined>()
  const [stage, setStage] = useState('全部环节')
  const routeKeys = useMemo(() => new Set([...ALL_VIEW_KEYS, 'overview']), [])
  const overviewQuery = useOverviewStats()
  const overview = overviewQuery.data
  const { showOverviewBanner } = usePlatformNotifications()
  const refCodesQuery = useRefCodeMaps()
  const signalsQuery = useSignalsListFiltered({ query, stageChip: stage })
  const {
    rows: cachedSignals,
    isFetching: signalsFetching,
    isError: signalsQueryError,
    refetch: refetchSignals,
  } = signalsQuery
  const themeQuery = useThemeRows()
  const themeRows = themeQuery.rows
  const refCodesBootstrapping = !refCodesQuery.isSuccess && !refCodesQuery.isError
  const signalsError = signalsQueryError || refCodesQuery.isError
  const themesError = themeQuery.isError || refCodesQuery.isError
  const overviewSurface = querySurfaceState(overviewQuery)
  const themeSurface = querySurfaceState({
    ...themeQuery,
    isPending: themeQuery.isPending || refCodesBootstrapping,
    isFetching: themeQuery.isFetching || refCodesQuery.isFetching,
  })
  const funnelSurface = querySurfaceState(overviewQuery)
  const signalsTableLoading = refCodesBootstrapping || signalsFetching

  const funnelSteps = useMemo(() => {
    if (!overviewQuery.isSuccess || !overview) return []
    if (overview.strategy_funnel) return strategyFunnelToFunnelSteps(overview.strategy_funnel)
    return overviewToFunnelSteps(overview)
  }, [overview, overviewQuery.isSuccess])

  const traceMetrics = useMemo(
    () => (overviewQuery.isSuccess && overview ? overviewToTraceMetrics(overview) : []),
    [overview, overviewQuery.isSuccess],
  )
  const overviewThemes = themeRows

  useEeaDataSync(activeMenu)

  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    setIsMobile(mq.matches)
    const requestedView = initialView
    const nextView =
      requestedView in utilityPages || isMainMenuRoute(requestedView) ? requestedView : 'overview'
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
  const { scheme: colorScheme, toggleExplicit: toggleColorScheme } = useShellColorScheme()
  const overviewSignalPagination = useSignalTablePagination()

  const filteredSignals = cachedSignals

  const signalTableColumns = buildSignalTableColumns({
    onNavigate: navigate,
    onTitleClick: (record) => navigate(`singal/${record.key}`),
  })

  const primaryMenuSelectedKeys = useMemo(() => {
    if (isMainMenuRoute(activeMenu)) return [activeMenu]
    if (activeMenu === 'archived') return ['signals']
    return []
  }, [activeMenu])

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
        colorScheme={colorScheme}
        layoutReady={layoutReady}
        primaryMenuSelectedKeys={primaryMenuSelectedKeys}
        siderUtilitySelectedKeys={siderUtilitySelectedKeys}
        pageTitleOverride={evidencePageTitle}
        onCollapse={setCollapsed}
        onNavigate={navigate}
        onToggleColorScheme={toggleColorScheme}
      >
            {activeMenu !== 'overview' ? (
            <div className={isEvidenceStudio ? 'content-wrap content-wrap-evidence-studio' : 'content-wrap'}>
              {activeMenu === 'archived' && <ArchivedSignalsView onNavigate={navigate} />}
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
              {overviewQuery.isSuccess && showOverviewBanner && overview?.panorama_import ? (
                <PanoramaImportBanner batch={overview.panorama_import} />
              ) : null}
              {overviewQuery.isSuccess && overview ? (
                <Card className="panel-card overview-workflow-rail" style={{ marginTop: 16 }}>
                  <div className="overview-workflow-rail-inner">
                    <div className="overview-workflow-rail-intro">
                      <div className="trace-icon" aria-hidden>
                        <BranchesOutlined />
                      </div>
                      <div>
                        <Title level={5} style={{ margin: 0 }}>
                          研究工作流
                        </Title>
                        <Text type="secondary">信号采集 → 主题归集 → 需求推导 → 战略研判</Text>
                      </div>
                    </div>
                    <div className="overview-workflow-rail-nodes">
                      {[
                        { label: '信号', value: overview.signals },
                        { label: '主题', value: overview.tech_themes },
                        { label: '需求点', value: overview.demand_points },
                        { label: '落脚点', value: overview.landing_points },
                        { label: '战略池', value: overview.funnel_pool },
                      ].map((node, index) => (
                        <span key={node.label} className="overview-workflow-rail-node">
                          {index > 0 ? <ArrowRightOutlined className="overview-workflow-rail-arrow" aria-hidden /> : null}
                          <span>
                            {node.label}
                            <b>{node.value}</b>
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ) : null}
              <Row gutter={[16, 16]} className="main-grid overview-workflow-grid" style={{ marginTop: 16 }} align="stretch">
                <Col xs={24} lg={15}>
                  <Card
                    variant="borderless"
                    className="panel-card"
                    title={(
                      <div>
                        <Title level={4}>技术主题动态</Title>
                        <Text type="secondary">跨来源信号聚合与需求点演进；频次按未归档成员信号，来源含归档记录。</Text>
                      </div>
                    )}
                    extra={<Button type="link" onClick={() => navigate('topics')}>查看全部 <ArrowRightOutlined /></Button>}
                  >
                    {themesError ? (
                      <QueryFailure message="技术主题加载失败，请检查服务连接后重试。" onRetry={() => { void (refCodesQuery.isError ? refCodesQuery.refetch() : themeQuery.refetch()) }} />
                    ) : (
                      <QuerySurface {...themeSurface} initial={<Spin />}>
                        {overviewThemes.length ? (
                          <div className="theme-list">
                            {overviewThemes.map((theme) => (
                              <div
                                className="theme-row clickable-row"
                                key={theme.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => navigate('topics')}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') navigate('topics')
                                }}
                              >
                                <div className="theme-icon" style={{ background: `${theme.color}14`, color: theme.color }}>
                                  <RadarChartOutlined />
                                </div>
                                <div className="theme-info">
                                  <div className="theme-name">
                                    <Text strong>{theme.name}</Text>
                                    <Tag color={theme.progress > 75 ? 'blue' : theme.progress > 60 ? 'cyan' : 'orange'}>
                                      {theme.progress > 75 ? '高热度' : '持续观察'}
                                    </Tag>
                                  </div>
                                  <Text type="secondary">{theme.note}</Text>
                                  <Progress percent={theme.progress} showInfo={false} strokeColor={theme.color} railColor="#eef2f6" size="small" />
                                </div>
                                <div className="theme-count">
                                  <Text strong>{theme.count}</Text>
                                  <Text type="secondary">信号</Text>
                                  <Text className="source-count">{theme.sources} 来源</Text>
                                </div>
                                <ArrowRightOutlined className="row-arrow" />
                              </div>
                            ))}
                          </div>
                        ) : themeSurface.showInitial ? null : (
                          <PlatformEmptyState
                            title="暂无技术主题"
                            description="主题将在保存真实信号并完成人工归集后显示。"
                            action={<Button type="link" onClick={() => navigate('topics')}>打开主题工作台</Button>}
                          />
                        )}
                      </QuerySurface>
                    )}
                  </Card>
                </Col>
                <Col xs={24} lg={9}>
                  <Card
                    variant="borderless"
                    className="panel-card funnel-card"
                    title={(
                      <div>
                        <Title level={4}>战略研判漏斗</Title>
                        <Text type="secondary">四步筛选与价值评估；按落脚点当前状态独占计数。</Text>
                      </div>
                    )}
                    extra={<Button type="text" icon={<MoreOutlined />} aria-label="打开战略研判" onClick={() => navigate('strategy')} />}
                  >
                    {overviewQuery.isError ? (
                      <QueryFailure message="战略研判数据加载失败，请检查服务连接后重试。" onRetry={() => { void overviewQuery.refetch() }} />
                    ) : (
                      <QuerySurface {...funnelSurface} initial={<Spin />}>
                        <StrategyFunnelCard onNavigate={navigateTo} steps={funnelSteps} />
                        <div className="funnel-footer">
                          <span>
                            <FundOutlined aria-hidden />
                            当前战略版本 <strong>{overview?.funnel_pool ?? 0}</strong> 项
                          </span>
                          {overview?.strategy_funnel ? (
                            <Space wrap size={4}>
                              {(overview.strategy_funnel.rejected ?? 0) > 0 ? (
                                <Tag color="orange">适配拒绝 {overview.strategy_funnel.rejected}</Tag>
                              ) : null}
                              {(overview.strategy_funnel.pool_entry_blocked ?? 0) > 0 ? (
                                <Tag>未入池 {overview.strategy_funnel.pool_entry_blocked}</Tag>
                              ) : null}
                            </Space>
                          ) : null}
                        </div>
                      </QuerySurface>
                    )}
                  </Card>
                </Col>
              </Row>
              <Card className="panel-card view-card signals-panel overview-signals-panel" title="最新信号" extra={<Space wrap><Input allowClear prefix={<SearchOutlined />} placeholder="搜索标题、发布主体或标签" value={query} onChange={(e) => setQuery(e.target.value)} /><Select value={stage} onChange={setStage} options={['全部环节', '创造端', '传递端', '兑现端', '规制端'].map((item) => ({ label: item, value: item }))} suffixIcon={<FilterOutlined />} className="stage-select" /><Button type="link" onClick={() => navigate('signals')}>打开证据库 <ArrowRightOutlined /></Button></Space>}>
                {signalsError ? (
                  <QueryFailure message="最新信号加载失败，请检查服务连接后重试。" onRetry={() => { void (refCodesQuery.isError ? refCodesQuery.refetch() : refetchSignals()) }} />
                ) : (
                  <Table rowKey="key" loading={signalsTableLoading} columns={signalTableColumns} dataSource={filteredSignals} pagination={overviewSignalPagination} scroll={{ x: 960 }} locale={signalsTableLocale(() => navigate('newSignal'))} />
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
                {overviewQuery.isError ? null : (
                  <QuerySurface {...overviewSurface} initial={<Spin />}>
                    <Row gutter={[16, 16]} align="middle">
                      {traceMetrics.map((metric) => (
                        <Col key={metric.label} xs={12} sm={6}>
                          <Statistic title={metric.label} value={metric.value} />
                        </Col>
                      ))}
                    </Row>
                  </QuerySurface>
                )}
              </Card>
              <Row gutter={[16, 16]} className="overview-secondary-footer" style={{ marginTop: 16 }}>
                <Col xs={24} xl={14}>
                  <Card
                    className="panel-card overview-secondary-card"
                    title="本周新增"
                    extra={(
                      overview?.weekly_window_start_utc && overview?.as_of_utc ? (
                        <Text type="secondary">
                          UTC {formatApiDate(overview.weekly_window_start_utc)} 至 {formatApiDate(overview.as_of_utc)}
                        </Text>
                      ) : (
                        <Text type="secondary">—</Text>
                      )
                    )}
                  >
                    {overviewQuery.isError ? (
                      <QueryFailure
                        message="本周统计加载失败，请检查服务连接后重试。"
                        onRetry={() => { void overviewQuery.refetch() }}
                      />
                    ) : (
                      <QuerySurface {...overviewSurface} initial={<Spin />}>
                        {overview?.weekly_new ? (
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
                              <Col key={String(label)} xs={12} sm={8} md={6} xl={4} xxl={3}>
                                <Statistic title={String(label)} value={Number(value)} />
                              </Col>
                            ))}
                          </Row>
                        ) : null}
                      </QuerySurface>
                    )}
                  </Card>
                </Col>
                <Col xs={24} xl={10}>
                  <Card className="panel-card overview-secondary-card" title="待处理与失败任务">
                    {overviewQuery.isError ? (
                      <QueryFailure
                        message="任务统计加载失败，请检查服务连接后重试。"
                        onRetry={() => { void overviewQuery.refetch() }}
                      />
                    ) : (
                      <QuerySurface {...overviewSurface} initial={<Spin />}>
                        {overview ? (
                          <Space wrap>
                            <Tag
                              color={overview.signals_pending_review > 0 ? 'orange' : 'default'}
                              className="overview-ops-tag"
                              role="button"
                              tabIndex={0}
                              onClick={() => navigate('signals')}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') navigate('signals')
                              }}
                            >
                              待复核信号：{overview.signals_pending_review}
                            </Tag>
                            <Tag
                              color={(overview.demand_points_pending_review ?? 0) > 0 ? 'orange' : 'default'}
                              className="overview-ops-tag"
                              role="button"
                              tabIndex={0}
                              onClick={() => navigate('topics')}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') navigate('topics')
                              }}
                            >
                              待复核需求：{overview.demand_points_pending_review ?? 0}
                            </Tag>
                            <Tag className="overview-ops-tag">采集任务进行中：{overview.capture_jobs_open ?? 0}</Tag>
                            <Tag color={(overview.capture_jobs_failed ?? 0) > 0 ? 'red' : 'default'} className="overview-ops-tag">
                              采集失败：{overview.capture_jobs_failed ?? 0}
                            </Tag>
                            <Tag
                              color={(overview.signals_fetch_failed ?? 0) > 0 ? 'red' : 'default'}
                              className="overview-ops-tag"
                              role="button"
                              tabIndex={0}
                              onClick={() => navigate('signals')}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') navigate('signals')
                              }}
                            >
                              抓取失败信号：{overview.signals_fetch_failed ?? 0}
                            </Tag>
                            <Tag color={(overview.documents_failed_ingest ?? 0) > 0 ? 'red' : 'default'} className="overview-ops-tag">
                              文档解析失败：{overview.documents_failed_ingest ?? 0}
                            </Tag>
                          </Space>
                        ) : null}
                      </QuerySurface>
                    )}
                  </Card>
                </Col>
              </Row>
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
