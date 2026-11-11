'use client'

import {
  AlertOutlined,
  CheckCircleFilled,
  FileSearchOutlined,
  FundProjectionScreenOutlined,
  LinkOutlined,
  MoreOutlined,
  ReadOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import { App as AntApp, Button, Dropdown, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { eeaQueryKeys } from '@/hooks/use-eea-queries'
import { patchSignal } from '@/lib/api/eea-api'
import { EeaApiError } from '@/lib/api/client'
import { buildAppPath } from '@/lib/navigation'
import type { Signal } from '@/types/platform'

const { Text } = Typography

export const signalStatusColors: Record<string, string> = {
  已留存: 'success',
  待人工复核: 'warning',
  抓取中: 'processing',
  抓取失败: 'error',
}

export function SignalStatusTag({ status }: { status: string }) {
  return <Tag color={signalStatusColors[status]}>{status}</Tag>
}

export function SignalRowActions({
  record,
  onNavigate,
  onQuickPreview,
}: {
  record: Signal
  onNavigate: (target: string) => void
  onQuickPreview?: (signal: Signal) => void
}) {
  const { message: messageApi, modal: modalApi } = AntApp.useApp()
  const queryClient = useQueryClient()

  const items: MenuProps['items'] = [
    { key: 'view', label: '查看证据', icon: <FileSearchOutlined /> },
    ...(onQuickPreview ? [{ key: 'preview', label: '快速预览', icon: <ReadOutlined /> }] : []),
    { key: 'topic', label: '加入主题', icon: <TagsOutlined /> },
    { key: 'trace', label: '查看推导链', icon: <FundProjectionScreenOutlined /> },
    ...(record.status === '待人工复核'
      ? [{ key: 'review', label: '开始人工复核', icon: <CheckCircleFilled /> }]
      : []),
    { type: 'divider' },
    { key: 'copy', label: '复制信号链接', icon: <LinkOutlined /> },
    { key: 'archive', label: '归档停用', icon: <AlertOutlined />, danger: true },
  ]

  const onMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation()
    switch (key) {
      case 'view':
        onNavigate(`singal/${record.key}`)
        break
      case 'preview':
        onQuickPreview?.(record)
        break
      case 'topic':
        onNavigate(`singal/${record.key}`)
        break
      case 'trace':
        onNavigate('traceDetail')
        break
      case 'review':
        onNavigate(`singal/${record.key}`)
        break
      case 'copy': {
        const link = `${window.location.origin}${buildAppPath({ view: 'singal', id: record.key })}`
        void navigator.clipboard.writeText(link).then(
          () => messageApi.success('信号链接已复制'),
          () => messageApi.error('复制失败，请手动复制链接'),
        )
        break
      }
      case 'archive':
        modalApi.confirm({
          title: '归档停用该信号？',
          content: '信号将从主证据库移出并写入数据库（evidence_status=archived）。可在「归档证据库」恢复或永久删除。',
          okText: '归档',
          cancelText: '取消',
          onOk: async () => {
            try {
              await patchSignal(record.key, { evidence_status_code: 'archived' })
              messageApi.success('已归档停用，可在「归档证据库」管理')
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['eea', 'signals'] }),
                queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview }),
              ])
            } catch (err) {
              const detail = err instanceof EeaApiError ? err.message : String(err)
              messageApi.error(detail || '归档失败')
            }
          },
        })
        break
      default:
        break
    }
  }

  return (
    <Dropdown menu={{ items, onClick: onMenuClick }} trigger={['click']} placement="bottomRight">
      <Button
        type="text"
        icon={<MoreOutlined />}
        aria-label="更多操作"
        onClick={(event) => event.stopPropagation()}
      />
    </Dropdown>
  )
}

export function buildSignalTableColumns({
  onNavigate,
  onTitleClick,
  onQuickPreview,
}: {
  onNavigate: (target: string) => void
  onTitleClick: (signal: Signal) => void
  onQuickPreview?: (signal: Signal) => void
}): ColumnsType<Signal> {
  return [
    {
      title: '信号标题',
      dataIndex: 'title',
      render: (value: string, record) => (
        <button type="button" className="signal-title signal-title-button" onClick={() => onTitleClick(record)}>
          <span className="signal-dot" />
          <span>
            <Space size={6} wrap>
              <Text strong>{value}</Text>
              {record.urlDuplicateRenamed ? (
                <Tooltip title="与已有证据同源；上传已允许，标题已自动加后缀区分">
                  <Tag color="gold" style={{ margin: 0 }}>
                    重复来源
                  </Tag>
                </Tooltip>
              ) : null}
            </Space>
            <span className="signal-meta">{record.publisher} · {record.channel}</span>
          </span>
        </button>
      ),
    },
    { title: '价值链环节', dataIndex: 'stage', render: (value: string) => <Tag className="stage-tag">{value}</Tag> },
    { title: '类型', dataIndex: 'type' },
    {
      title: '技术方向',
      dataIndex: 'tags',
      render: (values: string[]) => (
        <Space wrap>{values.map((tag) => <Tag key={tag} className="tech-tag">{tag}</Tag>)}</Space>
      ),
    },
    {
      title: '证据状态',
      dataIndex: 'status',
      render: (value: string) => <SignalStatusTag status={value} />,
    },
    { title: '更新时间', dataIndex: 'date' },
    {
      key: 'action',
      width: 44,
      render: (_value: unknown, record: Signal) => (
        <SignalRowActions record={record} onNavigate={onNavigate} onQuickPreview={onQuickPreview} />
      ),
    },
  ]
}
