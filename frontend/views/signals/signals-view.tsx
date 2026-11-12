'use client'

import { useEffect, useState } from 'react'
import { InboxOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Input, Row, Select, Space, Spin, Statistic, Table, Tooltip } from 'antd'
import { PageHeader } from '@/components/shared/page-header'
import { QueryFailure } from '@/components/shared/query-failure'
import { signalsTableLocale } from '@/components/shared/empty-state'
import { buildSignalTableColumns } from '@/features/evidence/signal-columns'
import { useOverviewStats, useRefCodeMaps, useSignalsListFiltered } from '@/hooks/use-eea-queries'
import { useSignalTablePagination } from '@/lib/signal-table-pagination'
import type { Signal } from '@/types/platform'

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
  const [tagFilter, setTagFilter] = useState('')
  const pager = useSignalTablePagination()
  const { rows: signalRows, total, isLoading, isError, refetch } = useSignalsListFiltered({
    query,
    stageChip: stage,
    themeId,
    tag: tagFilter,
    offset: (pager.current - 1) * pager.pageSize,
    limit: pager.pageSize,
  })

  useEffect(() => {
    pager.resetPage()
  }, [query, stage, themeId, tagFilter, pager.resetPage])
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
      <PageHeader
        eyebrow="01 · 原始信息采集"
        title="信号与证据库"
        description="收集产业信号，留存可追溯证据，并通过封闭词表完成机器预标。"
        action={
          <Space>
            <Button icon={<InboxOutlined />} onClick={() => onNavigate('archived')}>
              归档证据库
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('newSignal')}>
              新增信号
            </Button>
          </Space>
        }
      />
      {themeId ? <Alert type="info" showIcon style={{ marginBottom: 16 }} title="正在查看该主题下的信号" action={<Button size="small" onClick={onClearTheme}>清除主题筛选</Button>} /> : null}
      {overviewQuery.isError ? <QueryFailure message="信号统计加载失败，请检查服务连接后重试。" onRetry={() => { void overviewQuery.refetch() }} /> : null}
      <Row gutter={16} className="summary-row">
        <Col span={6}><Card><Statistic title="全部信号" value={overviewReady ? overview?.signals ?? 0 : '—'} /></Card></Col>
        <Col span={6}><Card><Statistic title={<Tooltip title="按非空 url_normalized 去重，包含已归档信号。">去重来源数</Tooltip>} value={overviewReady ? overview?.signal_sources ?? '—' : '—'} /></Card></Col>
        <Col span={6}><Card><Statistic title="已留存" value={overviewReady ? overview?.signals_retained ?? '—' : '—'} styles={{ content: { color: '#16a34a' } }} /></Card></Col>
        <Col span={6}><Card><Statistic title="待人工复核" value={overviewReady ? overview?.signals_pending_review ?? 0 : '—'} styles={{ content: { color: '#d97706' } }} /></Card></Col>
      </Row>
      <Card
        className="panel-card view-card"
        title="证据列表"
        extra={
          <Space wrap>
            <Input allowClear prefix={<SearchOutlined />} placeholder="搜索标题、发布主体" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Input allowClear placeholder="技术标签筛选" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} style={{ width: 160 }} />
            <Select value={stage} onChange={setStage} options={['全部环节', '创造端', '传递端', '兑现端', '规制端'].map((value) => ({ label: value, value }))} />
          </Space>
        }
      >
        {isError || refCodeQuery.isError ? (
          <QueryFailure message="信号列表加载失败，请检查服务连接后重试。" onRetry={() => { void (refCodeQuery.isError ? refCodeQuery.refetch() : refetch()) }} />
        ) : !refCodeQuery.isSuccess || isLoading ? (
          <Spin />
        ) : (
          <Table
            rowKey="key"
            columns={columns}
            dataSource={signalRows}
            pagination={{ ...pager, total }}
            scroll={{ x: 960 }}
            locale={signalsTableLocale(() => onNavigate('newSignal'))}
          />
        )}
      </Card>
    </>
  )
}
