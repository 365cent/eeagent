'use client'

import { memo } from 'react'
import { Button, Card, Flex, Space, Spin, Tag, Tooltip, Typography } from 'antd'
import { CheckOutlined, MergeCellsOutlined } from '@ant-design/icons'
import type { ThemeClusterProposal } from '@/lib/api/types'
import type { TagCluster, TopicCreationTier, TopicInduction } from '@/lib/topic-clustering'

const { Text } = Typography

export type TopicCandidateCardProps = {
  proposal: ThemeClusterProposal
  cluster: TagCluster
  induction: TopicInduction
  displayName: string
  /** A clustering pass is running: the AI title for this card is not ready yet. */
  namePending?: boolean
  stageLabel: string | null
  index: number
  active: boolean
  pending: boolean
  mergeName: string | null | undefined
  creationTier: TopicCreationTier
  canCreate: boolean
  creationReason: string
  reliableCount: number
  reliableSources: number
  onFocus: () => void
  onEstablish: () => void
  onMerge: () => void
}

export const TopicCandidateCard = memo(function TopicCandidateCard({
  proposal,
  displayName,
  namePending = false,
  stageLabel,
  index,
  active,
  pending,
  mergeName,
  creationTier,
  canCreate,
  creationReason,
  reliableCount,
  reliableSources,
  induction,
  onFocus,
  onEstablish,
  onMerge,
}: TopicCandidateCardProps) {
  const alreadyAssigned =
    proposal.members.length > 0 && proposal.members.every((member) => member.assigned)
  const deferPaint = index >= 2

  return (
    <Card
      size="small"
      className={[
        'topic-candidate-card',
        deferPaint ? 'topic-candidate-card--deferred' : '',
        active ? 'is-active' : '',
        creationTier === 'blocked' ? 'is-blocked' : '',
        creationTier === 'provisional' ? 'is-provisional' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      variant="borderless"
      onClick={onFocus}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={`候选主题 ${displayName}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onFocus()
        }
      }}
    >
      <Flex justify="space-between" align="flex-start" gap="middle" wrap>
        <Flex vertical gap={6} style={{ flex: 1, minWidth: 0 }}>
          <Space size={8} wrap>
            <Text type="secondary" className="topic-candidate-cluster-id">
              聚类 {String(index + 1).padStart(2, '0')}
            </Text>
            <Tag
              variant="filled"
              color={creationTier === 'ready' ? 'green' : creationTier === 'provisional' ? 'gold' : 'default'}
              className="topic-candidate-status"
            >
              {creationTier === 'ready' ? '可建主题' : creationTier === 'provisional' ? '预建主题' : '不可创建'}
            </Tag>
          </Space>
          <Text strong className="topic-candidate-title">
            {displayName}
            {namePending ? (
              <Spin
                size="small"
                className="topic-candidate-title-loading"
                aria-label="AI 主题名生成中"
              />
            ) : null}
          </Text>
          <Text type="secondary" className="topic-candidate-meta">
            {proposal.signal_count} 条聚类 · {reliableCount} 条可计证据 · {reliableSources} 来源可计 · 凝聚度{' '}
            {Math.round(proposal.cohesion * 100)}%
            {stageLabel ? ` · ${stageLabel}` : ''}
          </Text>
        </Flex>
        <Space wrap className="topic-candidate-actions">
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            disabled={pending || !canCreate}
            onClick={(event) => {
              event.stopPropagation()
              onEstablish()
            }}
          >
            创建主题
          </Button>
          {induction.mergeTarget && mergeName && !alreadyAssigned ? (
            <Button
              size="small"
              icon={<MergeCellsOutlined />}
              disabled={pending || !canCreate}
              onClick={(event) => {
                event.stopPropagation()
                onMerge()
              }}
            >
              并入「{mergeName}」
            </Button>
          ) : null}
        </Space>
      </Flex>
      <div className="topic-tag-row">
        {proposal.shared_tags.length > 0 ? (
          <Tag variant="filled" color="blue" className="topic-tag-common">
            共有 {proposal.shared_tags.length}
          </Tag>
        ) : null}
        {proposal.tag_distribution.slice(0, 8).map((item) => (
          <Tooltip
            key={item.tag}
            title={`${item.support} / ${proposal.signal_count} 条信号含此标签（组内 ${Math.round(item.cluster_share * 100)}%）`}
          >
            <Tag variant="filled" className="topic-tag">
              {item.tag}
            </Tag>
          </Tooltip>
        ))}
        {proposal.tag_distribution.length > 8 ? (
          <Text type="secondary" className="topic-tag-more">
            +{proposal.tag_distribution.length - 8}
          </Text>
        ) : null}
      </div>
      {creationTier === 'ready' ? null : (
        <Text type="secondary" className="topic-candidate-hold">
          {creationReason}
          {reliableCount < proposal.signal_count ? '（部分标题未过可靠性校验）' : ''}
        </Text>
      )}
      {proposal.members.length ? (
        <ul className="topic-candidate-evidence">
          {proposal.members.slice(0, 3).map((member) => (
            <li key={member.signal_id}>
              <Text type="secondary" ellipsis>
                {member.title}
              </Text>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
})