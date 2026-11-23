'use client'

import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Button, Card, Space, Spin, Tag, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { useVocabUsage } from '@/hooks/use-eea-queries'
import type { NavigateFn } from '@/types/platform'

const { Text } = Typography

export function TagSummaryCard({ onNavigate }: { onNavigate: NavigateFn }) {
  const vocab = useVocabUsage('tech_tag')
  const rows = useMemo(
    () => [...(vocab.data ?? [])].sort((a, b) => b.frequency - a.frequency || a.name.localeCompare(b.name, 'zh-CN')),
    [vocab.data],
  )
  const loading = vocab.isLoading
  const total = rows.reduce((sum, row) => sum + row.frequency, 0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ top: false, bottom: false })

  // The chip frame fades at whichever edge still hides rows, so a scrolled
  // list never looks like it has ended mid-row.
  const syncEdges = () => {
    const el = scrollRef.current
    if (!el) return
    setEdges({
      top: el.scrollTop > 4,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
    })
  }

  const handleChipScrollKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(key)) return
    event.preventDefault()
    const el = event.currentTarget
    const step = key.startsWith('Page') ? el.clientHeight - 32 : 44
    el.scrollBy({ top: key === 'ArrowUp' || key === 'PageUp' ? -step : step, behavior: 'smooth' })
  }

  const openTag = (name: string) => onNavigate({ view: 'signals', query: { keyword: name } })

  return (
    <Card
      className="panel-card tag-summary-card"
      title="标签汇总"
      extra={
        <Space size={8}>
          <Text type="secondary">
            {loading ? '更新中…' : `${total} 次 · ${rows.length} 词条`}
          </Text>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            aria-label="刷新标签汇总"
            onClick={() => void vocab.refetch()}
            loading={vocab.isFetching}
          />
        </Space>
      }
    >
      {loading && rows.length === 0 ? (
        <div className="tag-summary-loading">
          <Spin size="small" />
        </div>
      ) : rows.length === 0 ? (
        <PlatformEmptyState title="暂无技术方向" description="给信号打上技术方向后，这里按使用次数汇总。" />
      ) : (
        <div
          ref={scrollRef}
          className={[
            'tag-summary-chip-scroll',
            edges.top ? 'is-overflow-top' : '',
            edges.bottom ? 'is-overflow-bottom' : '',
          ].filter(Boolean).join(' ')}
          tabIndex={0}
          role="region"
          aria-label="技术标签汇总"
          onScroll={syncEdges}
          onKeyDown={handleChipScrollKey}
        >
          <Space wrap className="tag-summary-chip-row" size={[6, 6]}>
            {rows.map((row) => (
              <Tag key={row.id} className="tag-summary-chip" onClick={() => openTag(row.name)}>
                {row.name} <Text type="secondary">×{row.frequency}</Text>
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </Card>
  )
}