'use client'

import { useMemo, useState } from 'react'
import { DeleteOutlined, FileSearchOutlined, ReloadOutlined, RollbackOutlined } from '@ant-design/icons'
import { App as AntApp, Alert, Breadcrumb, Button, Card, Input, Space, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { eeaQueryKeys, useRefCodeMaps, useSignalsList } from '@/hooks/use-eea-queries'
import { deleteSignal, patchSignal } from '@/lib/api/eea-api'
import { EeaApiError } from '@/lib/api/client'
import { useSignalTablePagination } from '@/lib/signal-table-pagination'
import type { Signal } from '@/types/platform'
import { SignalStatusTag } from '@/features/evidence/signal-columns'

const { Text } = Typography

type ArchivedSignalsViewProps = {
  onNavigate: (key: string) => void
}

export function ArchivedSignalsView({ onNavigate }: ArchivedSignalsViewProps) {
  const signalPagination = useSignalTablePagination()
  const { message: messageApi, modal: modalApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const { rows, isLoading, isError, refetch } = useSignalsList({
    evidence_status: 'archived',
    keyword: keyword.trim() || undefined,
    limit: 200,
  })
  const refCodesQuery = useRefCodeMaps()

  const columns: ColumnsType<Signal> = useMemo(
    () => [
      {
        title: '标题',
        dataIndex: 'title',
        ellipsis: true,
        render: (title: string, record) => (
          <Button type="link" style={{ padding: 0 }} onClick={() => onNavigate(`singal/${record.key}`)}>
            {title}
          </Button>
        ),
      },
      { title: '来源', dataIndex: 'source', ellipsis: true },
      { title: '渠道', dataIndex: 'channel' },
      {
        title: '状态',
        dataIndex: 'status',
        render: (value: string) => <SignalStatusTag status={value} />,
      },
      { title: '归档前更新', dataIndex: 'date' },
      {
        title: '操作',
        key: 'actions',
        width: 220,
        render: (_value: unknown, record: Signal) => (
          <Space wrap size={4}>
            <Button
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() => onNavigate(`singal/${record.key}`)}
            >
              查看
            </Button>
            <Button
              size="small"
              icon={<RollbackOutlined />}
              onClick={() => {
                modalApi.confirm({
                  title: '恢复为已留存？',
                  content: '信号将重新出现在主证据库列表中。',
                  okText: '恢复',
                  cancelText: '取消',
                  onOk: async () => {
                    try {
                      await patchSignal(record.key, { evidence_status_code: 'retained' })
                      messageApi.success('已恢复为已留存')
                      await Promise.all([
                        queryClient.invalidateQueries({ queryKey: ['eea', 'signals'] }),
                        queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview }),
                      ])
                    } catch (err) {
                      const detail = err instanceof EeaApiError ? err.message : String(err)
                      messageApi.error(detail || '恢复失败')
                    }
                  },
                })
              }}
            >
              恢复
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
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
                      await Promise.all([
                        queryClient.invalidateQueries({ queryKey: ['eea', 'signals'] }),
                        queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview }),
                      ])
                    } catch (err) {
                      const detail = err instanceof EeaApiError ? err.message : String(err)
                      messageApi.error(detail || '删除失败')
                    }
                  },
                })
              }}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [messageApi, modalApi, onNavigate, queryClient],
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
        className="panel-card view-card"
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
          <Table rowKey="key" columns={columns} dataSource={rows} pagination={signalPagination} scroll={{ x: 960 }} />
        )}
      </Card>
    </>
  )
}
