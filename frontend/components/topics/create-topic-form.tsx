'use client'

import { useState } from 'react'
import { Segmented, Space, Typography } from 'antd'
import { TopicCreateAutoPanel } from '@/components/topics/topic-create-auto-panel'
import { TopicCreateManualPanel } from '@/components/topics/topic-create-manual-panel'
import type { NavigateFn } from '@/types/platform'

const { Text } = Typography

type CreateMode = 'auto' | 'manual'

export function CreateTopicForm({ onNavigate }: { onNavigate: NavigateFn }) {
  const [mode, setMode] = useState<CreateMode>('auto')

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Segmented
        value={mode}
        onChange={(value) => setMode(value as CreateMode)}
        options={[
          { label: '自动整理', value: 'auto' },
          { label: '手动整理', value: 'manual' },
        ]}
      />
      <Text type="secondary">
        {mode === 'auto'
          ? '标签先散开，再收成若干主题。多来源的组可以写入；只有一条证据的组先留在这里。'
          : '先点一条信号，系统按相似度建议一组；主题由你留下的全部信号收成。'}
      </Text>
      {mode === 'auto' ? (
        <TopicCreateAutoPanel onNavigate={onNavigate} />
      ) : (
        <TopicCreateManualPanel onNavigate={onNavigate} />
      )}
    </Space>
  )
}
