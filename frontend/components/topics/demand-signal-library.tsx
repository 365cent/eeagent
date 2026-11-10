'use client'

import { RobotOutlined } from '@ant-design/icons'
import { Button, Checkbox, Space, Spin, Tag, Typography } from 'antd'
import type { SignalOut } from '@/lib/api/types'

const { Text, Paragraph } = Typography

type DemandSignalLibraryProps = {
  signals: SignalOut[]
  selectedIds: string[]
  loading?: boolean
  compact?: boolean
  onChangeSelected: (ids: string[]) => void
}

export function DemandSignalLibrary({
  signals,
  selectedIds,
  loading,
  compact,
  onChangeSelected,
}: DemandSignalLibraryProps) {
  const selectedSet = new Set(selectedIds)

  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChangeSelected([...selectedSet, id])
      return
    }
    onChangeSelected(selectedIds.filter((item) => item !== id))
  }

  return (
    <div className={`demand-signal-library${compact ? ' demand-signal-library--compact' : ''}`}>
      <div className="demand-signal-library-head source-column-header evidence-column-head">
        <Text strong>信号编组</Text>
        {!compact ? (
          <Paragraph type="secondary" className="demand-signal-library-intro">
            每条留存信号对应一名助手；勾选后协调者会综合编组内信息作答。
          </Paragraph>
        ) : null}
        <Space wrap size={8}>
          <Button
            size="small"
            disabled={!signals.length}
            onClick={() => onChangeSelected(signals.map((s) => s.id))}
          >
            全选
          </Button>
          <Button size="small" disabled={!selectedIds.length} onClick={() => onChangeSelected([])}>
            清空
          </Button>
          <Tag variant="filled">{selectedIds.length} / {signals.length} 名助手</Tag>
        </Space>
      </div>
      <div className="demand-signal-bot-list">
        {loading ? (
          <div className="demand-signal-library-loading">
            <Spin /> <Text type="secondary">加载主题信号…</Text>
          </div>
        ) : null}
        {!loading && signals.length === 0 ? (
          <Text type="secondary">该主题下暂无留存网页信号。</Text>
        ) : null}
        {!loading
          ? signals.map((signal) => {
              const checked = selectedSet.has(signal.id)
              const tagPreview = (signal.tags ?? []).slice(0, 3)
              return (
                <label
                  key={signal.id}
                  className={`demand-signal-bot-card${checked ? ' is-selected' : ''}`}
                >
                  <Checkbox
                    checked={checked}
                    onChange={(event) => toggle(signal.id, event.target.checked)}
                  />
                  <span className="demand-signal-bot-avatar" aria-hidden>
                    <RobotOutlined />
                  </span>
                  <span className="demand-signal-bot-copy">
                    <Text strong className="demand-signal-bot-title">
                      {signal.title}
                    </Text>
                    <Text type="secondary" className="demand-signal-bot-meta">
                      {signal.publisher ?? signal.source_label ?? signal.url ?? '—'}
                    </Text>
                    {tagPreview.length > 0 ? (
                      <Space size={4} wrap className="demand-signal-bot-tags">
                        {tagPreview.map((tag) => (
                          <Tag key={tag} variant="filled">
                            {tag}
                          </Tag>
                        ))}
                      </Space>
                    ) : null}
                  </span>
                </label>
              )
            })
          : null}
      </div>
    </div>
  )
}
