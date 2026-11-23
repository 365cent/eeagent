'use client'

import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App as AntApp, Button, Card, Col, Row, Space, Table, Tag, Typography } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { PageHeader } from '@/components/shared/page-header'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { MetricHint } from '@/components/shared/metric-hint'
import { ThemeEditModal } from '@/components/topics/theme-edit-modal'
import { ThemeSignalsTable } from '@/components/topics/theme-signals-table'
import { TagSummaryCard } from '@/components/topics/tag-summary-card'
import { TopicClusteringPanel } from '@/components/topics/topic-clustering-panel'
import { deleteTheme } from '@/lib/api/eea-api'
import { EeaApiError, eeaErrorMessage } from '@/lib/api/client'
import { eeaQueryKeys, useRefCodeMaps, useThemeRows } from '@/hooks/use-eea-queries'
import { labelFor, shortStageLabel } from '@/lib/eea-mappers'
import { metricsFootnote, signalFrequencyHint, sourceCountHint } from '@/lib/metrics-copy'
import type { ThemeDetail } from '@/lib/api/types'
import type { NavigateFn } from '@/types/platform'

const { Text } = Typography

export function TopicsView({ onNavigate }: { onNavigate: NavigateFn }) {
  const { message: messageApi, modal: modalApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const { maps } = useRefCodeMaps()
  const { data: themes, rows: themeRows, isSuccess: themesReady, refetch: refetchThemes } = useThemeRows()
  const [openThemeId, setOpenThemeId] = useState<string | null>(null)
  const [editingTheme, setEditingTheme] = useState<ThemeDetail | null>(null)

  const refreshThemes = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.themes })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
    await refetchThemes()
  }, [queryClient, refetchThemes])

  const deleteMutation = useMutation({
    mutationFn: (themeId: string) => deleteTheme(themeId),
    onSuccess: async () => {
      await refreshThemes()
      setOpenThemeId(null)
      messageApi.success('主题已删除')
    },
    onError: (err, themeId) => {
      const blocked =
        err instanceof EeaApiError &&
        err.status === 409 &&
        (err.code === 'theme_has_demands' || err.message.includes('需求点'))
      if (blocked) {
        const demandId = err.demandIds[0]
        messageApi.error({
          content: (
            <span>
              {err.message}{' '}
              <Button
                type="link"
                size="small"
                onClick={() =>
                  onNavigate({
                    view: 'demands',
                    id: demandId,
                    query: { theme_id: themeId },
                  })
                }
              >
                打开需求点
              </Button>
            </span>
          ),
          duration: 8,
        })
        return
      }
      messageApi.error(eeaErrorMessage(err, '删除失败'))
    },
  })

  const confirmDeleteTheme = (record: ThemeDetail) => {
    modalApi.confirm({
      title: '删除主题',
      content: (
        <span>
          确定删除「{record.working_name}」？成员信号将移出该主题（仍保留在证据库）。若仍有需求点引用此主题，删除将被拒绝。
        </span>
      ),
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(record.id)
        } catch {
          // The mutation already explains a blocked delete and offers the demand page.
        }
      },
    })
  }

  return (
    <>
      <PageHeader
        eyebrow="02 · 需求点提取"
        title="主题与需求点"
        description="技术方向标签向上归总为候选主题，确认工作名后写入主题库；频次与来源数与服务端口径一致。"
        action={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('createTopic')}>
            新建主题
          </Button>
        }
      />
      <TopicClusteringPanel />
      <Row gutter={[18, 18]} className="summary-row" style={{ marginTop: 18 }}>
        <Col xs={24} lg={8}>
          <TagSummaryCard onNavigate={onNavigate} />
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
      <Card
        className="panel-card view-card theme-detail-table-card"
        title="主题明细"
        extra={<Text type="secondary">{metricsFootnote}</Text>}
      >
        <Table<ThemeDetail>
          className="theme-detail-table"
          rowKey="id"
          pagination={false}
          tableLayout="fixed"
          scroll={{ x: 1160 }}
          dataSource={themes ?? []}
          locale={{
            emptyText: <PlatformEmptyState title="暂无主题" description="创建主题并归集信号后，可在此回溯原证据。" />,
          }}
          expandable={{
            columnWidth: 48,
            expandedRowClassName: () => 'theme-detail-expanded-row',
            expandedRowKeys: openThemeId ? [openThemeId] : [],
            onExpand: (expanded, record) => setOpenThemeId(expanded ? record.id : null),
            expandedRowRender: (record) => (
              <div className="theme-detail-expand-panel">
                <ThemeSignalsTable
                  themeId={record.id}
                  onNavigate={onNavigate}
                  onMembershipChange={() => void refreshThemes()}
                />
              </div>
            ),
          }}
          columns={[
            { title: '工作名', dataIndex: 'working_name', width: 200, ellipsis: true },
            {
              title: '价值链',
              dataIndex: 'value_chain_stage_code',
              width: 96,
              render: (code: string | null) =>
                code ? shortStageLabel(labelFor(maps, 'value_chain_stage', code)) : '—',
            },
            {
              title: '技术方向',
              dataIndex: 'display_tags',
              width: 420,
              render: (tags: string[] | undefined) =>
                tags?.length ? (
                  <div className="theme-detail-tags-cell">
                    <Space wrap size={[4, 4]}>
                      {tags.map((tag) => (
                        <Tag key={tag}>
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                ) : (
                  '—'
                ),
            },
            {
              title: <MetricHint label="信号频次" hint={signalFrequencyHint} />,
              width: 108,
              align: 'right',
              render: (_v, record) => record.metrics?.signal_frequency ?? 0,
            },
            {
              title: <MetricHint label="来源数" hint={sourceCountHint} />,
              width: 96,
              align: 'right',
              render: (_v, record) => record.metrics?.source_count ?? 0,
            },
            {
              title: '操作',
              width: 240,
              fixed: 'right',
              render: (_v, record) => (
                <Space className="theme-detail-actions" size={0} wrap={false}>
                  <Button type="link" icon={<EditOutlined />} onClick={() => setEditingTheme(record)}>
                    编辑
                  </Button>
                  <Button
                    type="link"
                    onClick={() => onNavigate({ view: 'signals', query: { theme_id: record.id } })}
                  >
                    查看信号
                  </Button>
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => confirmDeleteTheme(record)}
                  >
                    删除
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <ThemeEditModal
        theme={editingTheme}
        open={editingTheme !== null}
        onClose={() => setEditingTheme(null)}
      />
    </>
  )
}
