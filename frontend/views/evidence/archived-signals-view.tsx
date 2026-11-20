'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReloadOutlined } from '@ant-design/icons'
import { App as AntApp, Alert, Breadcrumb, Button, Card, Input, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { useRefCodeMaps, useSignalsList } from '@/hooks/use-eea-queries'
import { deleteSignal, patchSignal } from '@/lib/api/eea-api'
import { invalidateSignalCaches } from '@/lib/query/invalidate-signal-caches'
import { eeaQueryKeys } from '@/lib/query/eea-query-keys'
import { EeaApiError } from '@/lib/api/client'
import type { SignalDetail } from '@/lib/api/types'
import { useSignalTablePagination } from '@/lib/signal-table-pagination'
import type { Signal } from '@/types/platform'
import { ArchivedSignalRowActions } from '@/features/evidence/archived-signal-row-actions'
import { SignalStatusTag } from '@/features/evidence/signal-columns'

const { Text } = Typography

type ArchivedSignalsViewProps = {
  onNavigate: (key: string) => void
  onSignalRemoved?: (signalId: string) => void
}

export function ArchivedSignalsView({ onNavigate, onSignalRemoved }: ArchivedSignalsViewProps) {
  const pager = useSignalTablePagination()
  const { message: messageApi, modal: modalApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const { rows, total, isLoading, isError, refetch } = useSignalsList({
    evidence_status: 'archived',
    keyword: keyword.trim() || undefined,
    offset: (pager.current - 1) * pager.pageSize,
    limit: pager.pageSize,
  })
  const refCodesQuery = useRefCodeMaps()

  useEffect(() => {
    pager.resetPage()
  }, [keyword, pager.resetPage])

  const openSignal = useCallback((signalId: string) => onNavigate(`singal/${signalId}`), [onNavigate])

  const confirmRestore = useCallback(
    (record: Signal) => {
      modalApi.confirm({
        title: '恢复为已留存？',
        content: '信号将重新出现在主证据库列表中。',
        okText: '恢复',
        cancelText: '取消',
        onOk: async () => {
          try {
            await patchSignal(record.key, { evidence_status_code: 'retained' })
            messageApi.success('已恢复为已留存')
            const cachedDetail = queryClient.getQueryData<SignalDetail>(eeaQueryKeys.signal(record.key))
            await invalidateSignalCaches(queryClient, {
              signalId: record.key,
              documentId: cachedDetail?.document_id,
            })
            onSignalRemoved?.(record.key)
          } catch (err) {
            const detail = err instanceof EeaApiError ? err.message : String(err)
            messageApi.error(detail || '恢复失败')
          }
        },
      })
    },
    [messageApi, modalApi, onSignalRemoved, queryClient],
  )

  const confirmDelete = useCallback(
    (record: Signal) => {
      modalApi.confirm({
        title: '永久删除该归档信号？',
        content: '数据库记录将被删除，此操作不可撤销。',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          try {
            await deleteSignal(record.key)
            messageApi.success('已永久删除')
            const cachedDetail = queryClient.getQueryData<SignalDetail>(eeaQueryKeys.signal(record.key))
            await invalidateSignalCaches(queryClient, {
              signalId: record.key,
              documentId: cachedDetail?.document_id,
              removeSignalDetail: true,
            })
            onSignalRemoved?.(record.key)
          } catch (err) {
            const detail = err instanceof EeaApiError ? err.message : String(err)
            messageApi.error(detail || '删除失败')
          }
        },
      })
    },
    [messageApi, modalApi, onSignalRemoved, queryClient],
  )

  const columns: ColumnsType<Signal> = useMemo(
    () => [
      {
        title: '标题',
        dataIndex: 'title',
        ellipsis: true,
        render: (title: string, record) => (
          <button type="button" className="signal-title-button archived-signal-title-button" onClick={() => openSignal(record.key)}>
            <span className="signal-dot" />
            <span>
              <Text strong ellipsis>
                {title}
              </Text>
              <span className="signal-meta">{record.publisher} · {record.channel}</span>
            </span>
          </button>
        ),
      },
      { title: '来源', dataIndex: 'publisher', ellipsis: true, width: 180 },
      { title: '渠道', dataIndex: 'channel', width: 108 },
      {
        title: '状态',
        dataIndex: 'status',
        width: 128,
        render: (value: string) => <SignalStatusTag status={value} />,
      },
      { title: '归档前更新', dataIndex: 'date', width: 120 },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        width: 196,
        className: 'archived-signals-actions-col',
        render: (_value: unknown, record: Signal) => (
          <ArchivedSignalRowActions
            record={record}
            onView={openSignal}
            onRestore={confirmRestore}
            onDelete={confirmDelete}
          />
        ),
      },
    ],
    [confirmDelete, confirmRestore, openSignal],
  )

  return (
    <>
      <Breadcrumb
        style={{ marginBottom: 12 }}
        items={[
          {
            title: (
              <Button type="link" size="small" style={{ padding: 0, height: 'auto' }} onClick={() => onNavigate('signals')}>
                证据列表
              </Button>
            ),
          },
          { title: '归档证据库' },
        ]}
      />
      <PageHeader
        eyebrow="01 · 原始信息采集 / 证据库"
        title="归档证据库"
        description="已归档停用的信号在此集中管理；可恢复至主库或永久删除数据库记录。"
        action={
          <Button icon={<ReloadOutlined />} onClick={() => void refetch()}>
            刷新
          </Button>
        }
      />
      <Card
        className="panel-card view-card archived-signals-panel"
        title="已归档信号"
        extra={
          <Input.Search
            allowClear
            placeholder="搜索标题或摘要"
            style={{ width: 260 }}
            onSearch={setKeyword}
          />
        }
      >
        {isError || refCodesQuery.isError ? (
          <Alert
            type="error"
            showIcon
            title="归档列表加载失败，请检查服务连接后重试。"
            action={
              <Button size="small" onClick={() => void (refCodesQuery.isError ? refCodesQuery.refetch() : refetch())}>
                重试
              </Button>
            }
          />
        ) : !refCodesQuery.isSuccess || isLoading ? (
          <Spin />
        ) : rows.length === 0 ? (
          <Text type="secondary">当前没有已归档停用的信号。</Text>
        ) : (
          <Table
            rowKey="key"
            columns={columns}
            dataSource={rows}
            pagination={{ ...pager, total }}
            scroll={{ x: 'max-content' }}
            tableLayout="auto"
          />
        )}
      </Card>
    </>
  )
}
