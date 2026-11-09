'use client'

import { useState } from 'react'
import { Button, Card, Col, Row, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { PageHeader } from '@/components/shared/page-header'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { MetricHint } from '@/components/shared/metric-hint'
import { DemandPointWorkbench } from '@/components/topics/demand-point-workbench'
import { useRefCodeMaps, useSignalsList, useThemeRows, useVocabUsage } from '@/hooks/use-eea-queries'
import { labelFor, shortStageLabel } from '@/lib/eea-mappers'
import { metricsFootnote, signalFrequencyHint, sourceCountHint } from '@/lib/metrics-copy'
import type { ThemeDetail } from '@/lib/api/types'
import type { NavigateFn } from '@/types/platform'

const { Text } = Typography

function ThemeSignals({ themeId, onNavigate }: { themeId: string; onNavigate: NavigateFn }) {
  const { rows, isLoading } = useSignalsList({ theme_id: themeId, limit: 200 })
  return (
    <Table
      size="small"
      rowKey="key"
      loading={isLoading}
      pagination={false}
      dataSource={rows}
      locale={{ emptyText: <Text type="secondary">该主题下暂无信号</Text> }}
      columns={[
        { title: '信号', dataIndex: 'title' },
        { title: '环节', dataIndex: 'stage' },
        {
          title: '操作',
          render: (_v, signal) => (
            <Button type="link" onClick={() => onNavigate(`singal/${signal.key}`)}>
              打开证据
            </Button>
          ),
        },
      ]}
    />
  )
}

export function TopicsView({ onNavigate }: { onNavigate: NavigateFn }) {
  const { maps } = useRefCodeMaps()
  const { data: themes, rows: themeRows, isSuccess: themesReady } = useThemeRows()
  const vocab = useVocabUsage()
  const [openThemeId, setOpenThemeId] = useState<string | null>(null)

  return (
    <>
      <PageHeader
        eyebrow="02 · 需求点提取"
        title="主题与需求点"
        description="将多源信号归集为可追溯主题。频次与来源数按服务端同一口径统计。"
        action={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('createTopic')}>
            新建主题
          </Button>
        }
      />
      <Row gutter={[18, 18]} className="summary-row">
        <Col xs={24} lg={8}>
          <Card
            className="panel-card tag-summary-card"
            title="标签汇总"
            extra={<Text type="secondary">{(vocab.data ?? []).reduce((sum, row) => sum + row.frequency, 0)} 次标注</Text>}
          >
            {(vocab.data ?? []).length === 0 ? (
              <PlatformEmptyState title="暂无技术方向" description="给信号打上技术方向后，这里按使用次数汇总。" />
            ) : (
              <Space wrap>
                {(vocab.data ?? []).slice(0, 18).map((row) => (
                  <Tag
                    key={row.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onNavigate({ view: 'signals', query: { keyword: row.name } })}
                  >
                    {row.name} <Text type="secondary">×{row.frequency}</Text>
                  </Tag>
                ))}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card
            className="panel-card topic-summary-card"
            title="主题汇总"
            extra={
              <Text type="secondary">
                <MetricHint label={`${themeRows.length} 个主题`} hint={metricsFootnote} />
              </Text>
            }
          >
            {themesReady && themeRows.length === 0 ? (
              <PlatformEmptyState title="暂无主题" description="新建主题后，在信号详情中把证据归集进来。" />
            ) : (
              <div className="topic-summary-list">
                {themeRows.slice(0, 4).map((theme) => (
                  <div className="topic-summary-item" key={theme.id}>
                    <div>
                      <Text strong>{theme.name}</Text>
                      <Text type="secondary">
                        <MetricHint label={`${theme.count} 条信号`} hint={signalFrequencyHint} />
                        {' · '}
                        <MetricHint label={`${theme.sources} 个来源`} hint={sourceCountHint} />
                      </Text>
                    </div>
                    <Tag>{theme.note.split(' · ')[0] ?? '—'}</Tag>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
      <Card className="panel-card view-card" title="主题明细" extra={<Text type="secondary">{metricsFootnote}</Text>}>
        <Table<ThemeDetail>
          rowKey="id"
          pagination={false}
          dataSource={themes ?? []}
          locale={{
            emptyText: <PlatformEmptyState title="暂无主题" description="创建主题并归集信号后，可在此回溯原证据。" />,
          }}
          expandable={{
            expandedRowKeys: openThemeId ? [openThemeId] : [],
            onExpand: (expanded, record) => setOpenThemeId(expanded ? record.id : null),
            expandedRowRender: (record) =>
              openThemeId === record.id ? <ThemeSignals themeId={record.id} onNavigate={onNavigate} /> : null,
          }}
          columns={[
            { title: '工作名', dataIndex: 'working_name' },
            {
              title: '价值链',
              dataIndex: 'value_chain_stage_code',
              render: (code: string | null) =>
                code ? shortStageLabel(labelFor(maps, 'value_chain_stage', code)) : '—',
            },
            {
              title: '技术方向',
              dataIndex: 'display_tags',
              render: (tags: string[] | undefined) =>
                tags?.length ? (
                  <Space wrap>{tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
                ) : (
                  '—'
                ),
            },
            {
              title: <MetricHint label="信号频次" hint={signalFrequencyHint} />,
              render: (_v, record) => record.metrics?.signal_frequency ?? 0,
            },
            {
              title: <MetricHint label="来源数" hint={sourceCountHint} />,
              render: (_v, record) => record.metrics?.source_count ?? 0,
            },
            {
              title: '操作',
              render: (_v, record) => (
                <Button
                  type="link"
                  onClick={() => onNavigate({ view: 'signals', query: { theme_id: record.id } })}
                >
                  查看信号
                </Button>
              ),
            },
          ]}
        />
      </Card>
      <DemandPointWorkbench />
    </>
  )
}
