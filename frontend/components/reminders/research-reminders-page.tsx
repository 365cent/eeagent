'use client'

import { Button, Card, List, Space, Tag, Typography } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { QueryFailure } from '@/components/shared/query-failure'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { useOverviewStats } from '@/hooks/use-eea-queries'
import type { NavigateFn } from '@/types/platform'

const { Text } = Typography

type ReminderRow = {
  key: string
  label: string
  count: number
  severity: 'default' | 'warning' | 'error'
  action: () => void
}

export function ResearchRemindersPage({ onNavigate }: { onNavigate: NavigateFn }) {
  const overviewQuery = useOverviewStats()
  const overview = overviewQuery.data

  const rows: ReminderRow[] = []
  if (overview) {
    const push = (row: ReminderRow) => {
      if (row.count > 0) rows.push(row)
    }
    push({
      key: 'signals-review',
      label: '待复核信号',
      count: overview.signals_pending_review,
      severity: overview.signals_pending_review > 0 ? 'warning' : 'default',
      action: () => onNavigate('signals'),
    })
    push({
      key: 'demands-review',
      label: '待复核需求点',
      count: overview.demand_points_pending_review ?? 0,
      severity: (overview.demand_points_pending_review ?? 0) > 0 ? 'warning' : 'default',
      action: () => onNavigate('demands'),
    })
    push({
      key: 'capture-open',
      label: '采集任务进行中',
      count: overview.capture_jobs_open ?? 0,
      severity: 'default',
      action: () => onNavigate('newSignal'),
    })
    push({
      key: 'capture-failed',
      label: '采集失败',
      count: overview.capture_jobs_failed ?? 0,
      severity: (overview.capture_jobs_failed ?? 0) > 0 ? 'error' : 'default',
      action: () => onNavigate('newSignal'),
    })
    push({
      key: 'fetch-failed',
      label: '抓取失败信号',
      count: overview.signals_fetch_failed ?? 0,
      severity: (overview.signals_fetch_failed ?? 0) > 0 ? 'error' : 'default',
      action: () => onNavigate('signals'),
    })
    push({
      key: 'doc-failed',
      label: '文档解析失败',
      count: overview.documents_failed_ingest ?? 0,
      severity: (overview.documents_failed_ingest ?? 0) > 0 ? 'error' : 'default',
      action: () => onNavigate('newSignal'),
    })
  }

  return (
    <Card className="panel-card view-card">
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        计数来自总览接口，点击可跳到对应工作台页面处理。
      </Text>
      {overviewQuery.isError ? (
        <QueryFailure message="提醒数据加载失败" onRetry={() => void overviewQuery.refetch()} />
      ) : null}
      {overviewQuery.isSuccess && rows.length === 0 ? (
        <PlatformEmptyState title="本周没有待办" description="待复核、采集失败等计数为零。" />
      ) : null}
      {rows.length > 0 ? (
        <List
          dataSource={rows}
          rowKey="key"
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key="go" type="link" icon={<ArrowRightOutlined />} onClick={item.action}>
                  去处理
                </Button>,
              ]}
            >
              <Space>
                <Tag color={item.severity === 'error' ? 'red' : item.severity === 'warning' ? 'orange' : 'default'}>
                  {item.count}
                </Tag>
                <Text>{item.label}</Text>
              </Space>
            </List.Item>
          )}
        />
      ) : null}
    </Card>
  )
}