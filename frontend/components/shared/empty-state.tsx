'use client'

import type { ReactNode } from 'react'
import { Button, Empty, Space, Typography } from 'antd'

const { Text } = Typography

type PlatformEmptyStateProps = {
  title?: string
  description?: string
  action?: ReactNode
}

export function PlatformEmptyState({
  title = '暂无数据',
  description = '使用 EEA Capture 抓取网页，或在平台内粘贴链接 / 上传文档入库。',
  action,
}: PlatformEmptyStateProps) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Space orientation="vertical" size={4}>
          <Text strong>{title}</Text>
          <Text type="secondary">{description}</Text>
          {action}
        </Space>
      }
    />
  )
}

export function signalsTableLocale(onImport?: () => void) {
  return {
    emptyText: (
      <PlatformEmptyState
        title="尚无信号"
        description="请用 Capture 客户端抓取，或从「新增信号」粘贴正文 / 上传文档。"
        action={
          onImport ? (
            <Button type="primary" size="small" onClick={onImport}>
              前往入库
            </Button>
          ) : undefined
        }
      />
    ),
  }
}
