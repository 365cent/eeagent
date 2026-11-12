'use client'

import { Button, Space, Typography } from 'antd'

const { Text } = Typography

export function QueryFailure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Space orientation="vertical" size={8}>
      <Text type="danger">{message}</Text>
      <Button size="small" onClick={onRetry}>重试</Button>
    </Space>
  )
}

