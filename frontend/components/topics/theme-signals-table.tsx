'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App as AntApp, Button, Space, Table, Typography } from 'antd'
import { DisconnectOutlined } from '@ant-design/icons'
import { putSignalTheme } from '@/lib/api/eea-api'
import { eeaErrorMessage } from '@/lib/api/client'
import { eeaQueryKeys, useSignalsList } from '@/hooks/use-eea-queries'
import type { NavigateFn } from '@/types/platform'

const { Text } = Typography

type ThemeSignalsTableProps = {
  themeId: string
  onNavigate: NavigateFn
  onMembershipChange?: () => void
}

export function ThemeSignalsTable({ themeId, onNavigate, onMembershipChange }: ThemeSignalsTableProps) {
  const { message: messageApi, modal: modalApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const { rows, isLoading, refetch } = useSignalsList({ theme_id: themeId, limit: 200 })

  const invalidateAfterMembership = async () => {
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.themes })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.signalsRoot })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.signalsPageRoot })
    await refetch()
    onMembershipChange?.()
  }

  const unassignMutation = useMutation({
    mutationFn: (signalId: string) =>
      putSignalTheme(signalId, {
        tech_theme_id: null,
      }),
    onSuccess: async () => {
      await invalidateAfterMembership()
      messageApi.success('已从主题移出')
    },
    onError: (err) => {
      const detail = eeaErrorMessage(err)
      messageApi.error(detail || '移出失败')
    },
  })

  const confirmUnassign = (signalId: string, title: string) => {
    modalApi.confirm({
      title: '移出主题',
      content: `确定将「${title}」从本主题移出？信号仍会保留在证据库。`,
      okText: '移出',
      cancelText: '取消',
      onOk: () => unassignMutation.mutateAsync(signalId),
    })
  }

  return (
    <Table
      className="theme-detail-nested-table"
      size="small"
      rowKey="key"
      tableLayout="fixed"
      scroll={{ x: 720 }}
      loading={isLoading || unassignMutation.isPending}
      pagination={false}
      dataSource={rows}
      locale={{ emptyText: <Text type="secondary">该主题下暂无信号</Text> }}
      columns={[
        { title: '信号', dataIndex: 'title', ellipsis: true },
        { title: '环节', dataIndex: 'stage', width: 100 },
        {
          title: '操作',
          width: 180,
          render: (_v, signal) => (
            <Space size={0} wrap>
              <Button type="link" size="small" onClick={() => onNavigate(`singal/${signal.key}`)}>
                打开证据
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<DisconnectOutlined />}
                onClick={() => confirmUnassign(signal.key, signal.title)}
              >
                移出主题
              </Button>
            </Space>
          ),
        },
      ]}
    />
  )
}
