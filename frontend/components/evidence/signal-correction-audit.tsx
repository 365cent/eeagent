'use client'

import { Button, Collapse, Space, Table, Typography } from 'antd'
import { useCorrectionAudit, useRefCodeMaps } from '@/hooks/use-eea-queries'
import type { AuditValue } from '@/lib/api/types'
import { labelFor, type RefCodeMaps } from '@/lib/eea-mappers'
import { PlatformEmptyState } from '@/components/shared/empty-state'

const { Text } = Typography

const FIELD_LABELS: Record<string, string> = {
  value_chain_stage_code: '价值链环节',
  signal_type_code: '信号类型',
  evolution_node_code: '演进节点',
  tech_tags: '技术方向',
  tech_theme_id: '主题',
}

function formatAuditValue(field: string, value: AuditValue, maps: RefCodeMaps): string {
  if (value == null) return '—'
  if (Array.isArray(value)) return value.map(String).join(' · ') || '—'
  if (typeof value === 'object') return JSON.stringify(value)
  if (field === 'value_chain_stage_code') return labelFor(maps, 'value_chain_stage', value)
  if (field === 'signal_type_code') return labelFor(maps, 'signal_type', value)
  if (field === 'evolution_node_code') return labelFor(maps, 'evolution_node', value)
  return value
}

export function SignalCorrectionAudit({ signalId }: { signalId: string }) {
  const { data, isLoading, isSuccess, isError, refetch } = useCorrectionAudit(signalId)
  const { maps } = useRefCodeMaps()
  const rows = data ?? []

  return (
    <Collapse
      size="small"
      items={[
        {
          key: 'audit',
          label: `修正记录${isSuccess ? `（${rows.length}）` : ''}`,
          children: (
            isError ? (
              <Space size={8}>
                <Text type="danger">修正审计加载失败</Text>
                <Button size="small" onClick={() => void refetch()}>重试</Button>
              </Space>
            ) : (
              <Table
                size="small"
                rowKey="id"
                loading={isLoading}
                pagination={false}
                dataSource={rows}
                locale={{
                  emptyText: <PlatformEmptyState title="暂无人工修正" description="保存分类或标签后，服务端记录的原值、新值、操作人和时间会显示在这里。" />,
                }}
                columns={[
                  {
                    title: '字段',
                    dataIndex: 'field_name',
                    render: (value: string) => FIELD_LABELS[value] ?? value,
                  },
                  {
                    title: '原值',
                    dataIndex: 'old_value',
                    render: (value: AuditValue, record) => (
                      <Text>{formatAuditValue(record.field_name, value, maps)}</Text>
                    ),
                  },
                  {
                    title: '新值',
                    dataIndex: 'new_value',
                    render: (value: AuditValue, record) => (
                      <Text>{formatAuditValue(record.field_name, value, maps)}</Text>
                    ),
                  },
                  {
                    title: '服务端操作人',
                    dataIndex: 'operator_subject',
                    render: (value: string, record) => `${value}（${record.operator_role}）`,
                  },
                  {
                    title: '服务端时间',
                    dataIndex: 'corrected_at',
                    render: (value: string) => value?.replace('T', ' ') ?? '—',
                  },
                ]}
              />
            )
          ),
        },
      ]}
    />
  )
}
