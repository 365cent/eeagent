'use client'

import { useMemo, useState } from 'react'
import {
  App as AntApp,
  Alert,
  Button,
  Card,
  Empty,
  Modal,
  Radio,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EeaApiError } from '@/lib/api/client'
import { fetchSignalDuplicates, postSignalDuplicateCleanup } from '@/lib/api/eea-api'
import { invalidateSignalCaches } from '@/lib/query/invalidate-signal-caches'
import type { DuplicateGroup, DuplicateMember } from '@/lib/api/types'

const { Text } = Typography

const DUPLICATE_SCAN_KEY = ['eea', 'signals', 'duplicates'] as const

function formatDiffValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.length ? value.join('、') : '—'
  if (typeof value === 'boolean') return value ? '有' : '无'
  const text = String(value)
  if (field === 'body_sha256') return `${text.slice(0, 12)}…`
  if (field === 'tech_theme_id') return `主题 ${text.slice(0, 8)}`
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

function memberLabel(member: DuplicateMember): string {
  return member.title.length > 26 ? `${member.title.slice(0, 26)}…` : member.title
}

export function SignalDuplicateCleanupModal({
  open,
  onClose,
  onCleaned,
}: {
  open: boolean
  onClose: () => void
  onCleaned?: () => void
}) {
  const { message: messageApi, modal: modalApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<string | null>(null)
  const [keepChoice, setKeepChoice] = useState<Record<string, string>>({})

  const scanQuery = useQuery({
    queryKey: DUPLICATE_SCAN_KEY,
    queryFn: fetchSignalDuplicates,
    enabled: open,
    staleTime: 0,
  })

  const scan = scanQuery.data
  const identicalGroups = useMemo(
    () => (scan?.groups ?? []).filter((group) => group.identical),
    [scan],
  )
  const differentGroups = useMemo(
    () => (scan?.groups ?? []).filter((group) => !group.identical),
    [scan],
  )
  const identicalIds = useMemo(
    () => identicalGroups.flatMap((group) => group.members.filter((m) => !m.keep).map((m) => m.id)),
    [identicalGroups],
  )
  const keepFor = (group: DuplicateGroup) =>
    keepChoice[group.key] ?? group.members.find((member) => member.keep)?.id ?? group.members[0]?.id

  const afterCleanup = async (deleted: number, remaining: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: DUPLICATE_SCAN_KEY }),
      invalidateSignalCaches(queryClient),
    ])
    onCleaned?.()
    messageApi.success(
      remaining > 0
        ? `已删除 ${deleted} 条重复信号，剩余 ${remaining} 组待确认`
        : `已删除 ${deleted} 条重复信号，重复已清空`,
    )
  }

  const runCleanup = async (deleteIds: string[], reason: string) => {
    setPending(reason)
    try {
      const result = await postSignalDuplicateCleanup(deleteIds, reason)
      const skipped = result.skipped.length
      await afterCleanup(result.deleted.length, result.remaining_groups)
      if (skipped) {
        messageApi.warning(`${skipped} 条未删除：${result.skipped[0].reason}`)
      }
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '清理失败')
    } finally {
      setPending(null)
    }
  }

  const confirmIdentical = () => {
    if (!identicalIds.length) return
    modalApi.confirm({
      title: `直接删除 ${identicalIds.length} 条完全相同的副本？`,
      content:
        '这些副本与原记录的标题、来源、摘要、正文和标签完全一致，每组只保留一份。删除会写入审计记录，且不可撤销。',
      okText: '删除副本',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => runCleanup(identicalIds, '清理完全相同的重复副本'),
    })
  }

  const confirmGroup = (group: DuplicateGroup) => {
    const keepId = keepFor(group)
    const deleteIds = group.members.filter((member) => member.id !== keepId).map((member) => member.id)
    if (!deleteIds.length) return
    modalApi.confirm({
      title: `保留「${memberLabel(group.members.find((m) => m.id === keepId) ?? group.members[0])}」，删除其余 ${deleteIds.length} 条？`,
      content: '删除会写入审计记录，且不可撤销。',
      okText: '删除其余',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => runCleanup(deleteIds, '人工确认后清理重复副本'),
    })
  }

  const memberColumns = (group: DuplicateGroup): ColumnsType<DuplicateMember> => [
    {
      title: '保留',
      key: 'keep',
      width: 56,
      render: (_value, member) => (
        <Radio
          checked={keepFor(group) === member.id}
          onChange={() => setKeepChoice((prev) => ({ ...prev, [group.key]: member.id }))}
          aria-label={`保留 ${member.title}`}
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      render: (value: string, member) => (
        <Space size={6} wrap>
          <Text strong={keepFor(group) === member.id}>{value}</Text>
          {member.keep ? <Tag color="blue">建议保留</Tag> : null}
        </Space>
      ),
    },
    { title: '状态', dataIndex: 'evidence_status_code', width: 110 },
    {
      title: '留存',
      key: 'assets',
      width: 130,
      render: (_value, member) => (
        <Space size={4}>
          <Tag color={member.has_archive ? 'green' : 'default'}>归档</Tag>
          <Tag color={member.has_body ? 'green' : 'default'}>正文</Tag>
        </Space>
      ),
    },
    {
      title: '技术标签',
      dataIndex: 'tags',
      render: (tags: string[]) => (tags.length ? tags.join('、') : '—'),
    },
    { title: '采集时间', dataIndex: 'created_at', width: 170 },
  ]

  const diffColumns = (group: DuplicateGroup): ColumnsType<{ field: string }> => [
    {
      title: '字段',
      dataIndex: 'field',
      width: 120,
      render: (field: string) => group.field_labels[field] ?? field,
    },
    ...group.members.map((member) => ({
      title: memberLabel(member),
      key: member.id,
      render: (_value: unknown, row: { field: string }) => {
        const value = group.values[row.field]?.[member.id]
        const kept = keepFor(group) === member.id
        return (
          <Text type={kept ? undefined : 'secondary'} className="signal-dedupe-diff-value">
            {formatDiffValue(row.field, value)}
          </Text>
        )
      },
    })),
  ]

  const body = () => {
    if (scanQuery.isLoading) return <Spin />
    if (scanQuery.isError) {
      return (
        <Alert
          type="error"
          showIcon
          title="重复扫描失败"
          description="无法读取重复信号，请检查服务连接后重试。"
          action={<Button size="small" onClick={() => void scanQuery.refetch()}>重试</Button>}
        />
      )
    }
    if (!scan || scan.groups.length === 0) {
      return <Empty description="没有发现重复信号：按来源链接与正文内容比对均唯一。" />
    }
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          title={`共 ${scan.groups.length} 组重复，涉及 ${scan.redundant_signals} 条多余副本`}
          description={`其中 ${scan.identical_groups} 组完全相同（可直接删除副本），${scan.different_groups} 组存在差异（需你选择保留哪一条）。共 ${scan.total_signals} 条信号。`}
        />

        {identicalGroups.length ? (
          <Card
            size="small"
            title={`完全相同的重复（${identicalIds.length} 条可删除）`}
            extra={
              <Button
                danger
                type="primary"
                size="small"
                loading={pending === '清理完全相同的重复副本'}
                onClick={confirmIdentical}
              >
                直接删除副本
              </Button>
            }
          >
            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
              {identicalGroups.map((group) => {
                const survivor = group.members.find((member) => member.keep) ?? group.members[0]
                return (
                  <Text key={group.key} type="secondary" className="signal-dedupe-line">
                    保留「{survivor.title}」· 删除 {group.members.length - 1} 条副本 ·{' '}
                    {group.kind === 'url' ? '同来源链接' : '同正文内容'}
                  </Text>
                )
              })}
            </Space>
          </Card>
        ) : null}

        {differentGroups.map((group) => {
          const keepId = keepFor(group)
          const deleteCount = group.members.length - 1
          return (
            <Card
              key={group.key}
              size="small"
              title={`存在差异（${group.different_fields.length} 个字段不同）`}
              extra={
                <Button
                  danger
                  size="small"
                  loading={pending === '人工确认后清理重复副本'}
                  onClick={() => confirmGroup(group)}
                >
                  删除其余 {deleteCount} 条
                </Button>
              }
            >
              <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                <Table
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={group.members}
                  columns={memberColumns(group)}
                  scroll={{ x: 720 }}
                />
                <Text type="secondary">
                  逐字段对比（浅色为待删除副本，仅保留所选的一条）：
                </Text>
                <Table
                  size="small"
                  rowKey="field"
                  pagination={false}
                  dataSource={group.different_fields.map((field) => ({ field }))}
                  columns={diffColumns(group)}
                  scroll={{ x: 720 }}
                />
              </Space>
            </Card>
          )
        })}
      </Space>
    )
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={880}
      title="清理重复信号"
      footer={
        <Space>
          <Button onClick={() => void scanQuery.refetch()} loading={scanQuery.isFetching}>
            重新扫描
          </Button>
          <Button type="primary" onClick={onClose}>
            完成
          </Button>
        </Space>
      }
      destroyOnHidden
    >
      {body()}
    </Modal>
  )
}
