'use client'

import { useMemo, useState } from 'react'
import {
  App as AntApp,
  Alert,
  Button,
  Card,
  Checkbox,
  Empty,
  Modal,
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
  const [deleteChoice, setDeleteChoice] = useState<Record<string, string[]>>({})

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
  // url_suspect groups only share a URL prefix and may be different articles:
  // start with nothing selected so every deletion is explicit.
  const defaultDeleteIds = (group: DuplicateGroup) =>
    group.kind === 'url_suspect'
      ? []
      : group.members.filter((member) => !member.keep).map((member) => member.id)

  const deleteIdsFor = (group: DuplicateGroup) => {
    const chosen = deleteChoice[group.key]
    if (chosen) {
      return chosen.filter((id) => group.members.some((member) => member.id === id))
    }
    return defaultDeleteIds(group)
  }

  const toggleDelete = (group: DuplicateGroup, memberId: string, checked: boolean) => {
    const current = deleteIdsFor(group)
    if (checked && !current.includes(memberId) && current.length >= group.members.length - 1) {
      messageApi.warning('每组至少保留 1 条')
      return
    }
    const next = checked ? [...current, memberId] : current.filter((id) => id !== memberId)
    setDeleteChoice((prev) => ({ ...prev, [group.key]: next }))
  }

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
      title: `删除 ${identicalIds.length} 条完全相同的副本？`,
      content: '内容完全一致，每组保留一份。删除会记入审计，且不可恢复。',
      okText: `删除 ${identicalIds.length} 条`,
      okButtonProps: { danger: true },
      cancelText: '取消',
      autoFocusButton: 'cancel',
      onOk: () => runCleanup(identicalIds, '清理完全相同的重复副本'),
    })
  }

  const confirmGroup = (group: DuplicateGroup) => {
    const deleteIds = deleteIdsFor(group)
    const targets = group.members.filter((member) => deleteIds.includes(member.id))
    if (!targets.length || targets.length === group.members.length) return
    const kept = group.members.filter((member) => !deleteIds.includes(member.id))
    modalApi.confirm({
      title: `删除 ${targets.length} 条，保留 ${kept.length} 条？`,
      content: `将保留：${kept.map((member) => `「${memberLabel(member)}」`).join('、')}。删除会记入审计，且不可恢复。`,
      okText: `删除 ${targets.length} 条`,
      okButtonProps: { danger: true },
      cancelText: '取消',
      autoFocusButton: 'cancel',
      onOk: () => runCleanup(deleteIds, '人工确认后清理重复副本'),
    })
  }

  const scanSummary = () => {
    if (!scan) return ''
    const parts: string[] = []
    if (scan.identical_groups) parts.push(`${scan.identical_groups} 组完全相同，可直接清理`)
    if (scan.different_groups) parts.push(`${scan.different_groups} 组存在差异，勾选要删除的副本`)
    return `${parts.join('；')}。每组至少保留 1 条。`
  }

  const memberColumns = (group: DuplicateGroup): ColumnsType<DuplicateMember> => [
    {
      title: '删除',
      key: 'delete',
      width: 56,
      render: (_value, member) => (
        <Checkbox
          className="signal-dedupe-select"
          checked={deleteIdsFor(group).includes(member.id)}
          onChange={(event) => toggleDelete(group, member.id, event.target.checked)}
          aria-label={`删除 ${member.title}`}
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      render: (value: string, member) => {
        const deleting = deleteIdsFor(group).includes(member.id)
        return (
          <Space size={6} wrap>
            <Text strong={!deleting} type={deleting ? 'danger' : undefined}>
              {value}
            </Text>
            {member.keep ? <Tag color="blue">建议保留</Tag> : null}
            {deleting ? <Tag color="red">将删除</Tag> : null}
          </Space>
        )
      },
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
    ...group.members.map((member) => {
      const deleting = deleteIdsFor(group).includes(member.id)
      return {
        title: (
          <Space size={4} wrap>
            <span>{memberLabel(member)}</span>
            <Tag color={deleting ? 'red' : 'default'}>{deleting ? '将删除' : '保留'}</Tag>
          </Space>
        ),
        key: member.id,
        render: (_value: unknown, row: { field: string }) => {
          const value = group.values[row.field]?.[member.id]
          return (
            <Text type={deleting ? 'danger' : 'secondary'} className="signal-dedupe-diff-value">
              {formatDiffValue(row.field, value)}
            </Text>
          )
        },
      }
    }),
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
      return <Empty description="没有发现重复信号。" />
    }
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          title={`${scan.groups.length} 组重复 · ${scan.redundant_signals} 条多余副本`}
          description={scanSummary()}
        />

        {identicalGroups.length ? (
          <Card
            size="small"
            title={`完全相同的重复（${identicalIds.length} 条）`}
            extra={
              <Button
                danger
                type="primary"
                size="small"
                loading={pending === '清理完全相同的重复副本'}
                onClick={confirmIdentical}
              >
                删除副本
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
          const deleteIds = deleteIdsFor(group)
          return (
            <Card
              key={group.key}
              size="small"
              title={
                group.kind === 'url_suspect'
                  ? `疑似同站链接 · ${group.members.length} 条`
                  : `${group.different_fields.length} 处字段不同`
              }
              extra={
                <Button
                  danger
                  size="small"
                  disabled={!deleteIds.length}
                  loading={pending === '人工确认后清理重复副本'}
                  onClick={() => confirmGroup(group)}
                >
                  删除所选{deleteIds.length ? ` ${deleteIds.length} 条` : ''}
                </Button>
              }
            >
              <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                {group.kind === 'url_suspect' ? (
                  <Alert
                    type="warning"
                    showIcon
                    title="可能不是同一篇文章"
                    description="仅链接前缀相同。核对标题和摘要后再勾选删除。"
                  />
                ) : null}
                <Table
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={group.members}
                  columns={memberColumns(group)}
                  scroll={{ x: 720 }}
                />
                <Text type="secondary">
                  选中要删除的副本；“将删除”的列会被移除：
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
