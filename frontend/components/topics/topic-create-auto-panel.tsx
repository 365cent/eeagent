'use client'

import { useEffect, useMemo, useState } from 'react'
import { App as AntApp, Button, Card, Col, Flex, Input, Modal, Row, Space, Tag, Typography } from 'antd'
import { CheckOutlined, MergeCellsOutlined, ReloadOutlined } from '@ant-design/icons'
import { createTheme, putSignalTheme } from '@/lib/api/eea-api'
import { EeaApiError, eeaErrorMessage } from '@/lib/api/client'
import { TopicClusterStage, type ClusterStagePhase } from '@/components/topics/topic-cluster-stage'
import { useTopicClusterCandidates } from '@/hooks/use-topic-cluster-candidates'
import { useRefCodeMaps } from '@/hooks/use-eea-queries'
import { labelFor, shortStageLabel } from '@/lib/eea-mappers'
import { proposalToCluster } from '@/lib/topic-cluster-report'
import {
  clusterQualifiesForTopic,
  induceTopicFromCluster,
  proposeNaturalTopicName,
  reliableClusterSignals,
  type TagCluster,
} from '@/lib/topic-clustering'
import type { ThemeClusterProposal } from '@/lib/api/types'
import type { NavigateFn } from '@/types/platform'

const { Text, Paragraph } = Typography

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function TopicCreateAutoPanel({ onNavigate }: { onNavigate: NavigateFn }) {
  const { message: messageApi } = AntApp.useApp()
  const { maps } = useRefCodeMaps()
  const {
    themes,
    vocabRows,
    themeTagMap,
    clusterReport,
    clusterReportLoading,
    clusterReportError,
    invalidateAll,
  } = useTopicClusterCandidates()
  const [namingCluster, setNamingCluster] = useState<{ cluster: TagCluster; name: string } | null>(null)
  const [pending, setPending] = useState(false)
  const [replayToken, setReplayToken] = useState(0)
  const [phase, setPhase] = useState<ClusterStagePhase>('scatter')
  const [formingKey, setFormingKey] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const stageTags = useMemo(() => {
    if (clusterReport && clusterReport.tag_distribution.length > 0) {
      return clusterReport.tag_distribution.map((item) => ({ tag: item.tag, support: item.support }))
    }
    return vocabRows.map((row) => ({ tag: row.name, support: row.frequency }))
  }, [clusterReport, vocabRows])

  const prepared = useMemo(() => {
    return (clusterReport?.clusters ?? []).map((proposal) => {
      const cluster = proposalToCluster(proposal)
      const stageLabel = proposal.value_chain_stage_code
        ? shortStageLabel(labelFor(maps, 'value_chain_stage', proposal.value_chain_stage_code))
        : null
      const attribution = proposal.shared_tags.length
        ? proposal.shared_tags
        : proposal.tag_distribution.map((item) => item.tag)
      const displayName = proposeNaturalTopicName(cluster.signals, attribution, stageLabel)
      const induction = induceTopicFromCluster(cluster, themeTagMap)
      return { proposal, cluster, stageLabel, displayName, induction }
    })
  }, [clusterReport, maps, themeTagMap])

  const stageClusters = useMemo(
    () =>
      prepared.slice(0, 4).map(({ proposal, displayName }) => ({
        key: proposal.key,
        label: displayName,
        tags: proposal.tag_distribution.map((item) => item.tag),
      })),
    [prepared],
  )

  const stageSignature = `${replayToken}|${stageTags.map((item) => item.tag).join(',')}|${stageClusters
    .map((item) => item.key)
    .join(',')}`

  useEffect(() => {
    if (stageTags.length === 0 || reducedMotion()) {
      setPhase('formed')
      return
    }
    setPhase('scatter')
    const gatherAt = window.setTimeout(() => setPhase('gather'), 1200)
    const formedAt = window.setTimeout(() => setPhase('formed'), 2300)
    return () => {
      window.clearTimeout(gatherAt)
      window.clearTimeout(formedAt)
    }
  }, [stageSignature, stageTags.length])

  const assignToTheme = async (cluster: TagCluster, themeId: string) => {
    const gate = clusterQualifiesForTopic(cluster)
    if (!gate.ok) {
      messageApi.warning(gate.reason)
      return
    }
    setPending(true)
    try {
      for (const signal of reliableClusterSignals(cluster)) {
        await putSignalTheme(signal.id, {
          tech_theme_id: themeId,
          expected_updated_at: signal.updated_at,
        })
      }
      await invalidateAll()
      messageApi.success(`已将 ${reliableClusterSignals(cluster).length} 条证据归入主题`)
    } catch (err) {
      const detail = eeaErrorMessage(err)
      messageApi.error(detail || '归集失败')
    } finally {
      setPending(false)
    }
  }

  const establishAsNewTopic = async (cluster: TagCluster, workingName: string, stageCode: string | null) => {
    setPending(true)
    try {
      const created = await createTheme({
        working_name: workingName.slice(0, 120),
        value_chain_stage_code: stageCode,
      })
      for (const signal of reliableClusterSignals(cluster)) {
        await putSignalTheme(signal.id, {
          tech_theme_id: created.id,
          expected_updated_at: signal.updated_at,
        })
      }
      await invalidateAll()
      messageApi.success('主题已创建')
      setNamingCluster(null)
      onNavigate('topics')
    } catch (err) {
      const detail = eeaErrorMessage(err)
      messageApi.error(detail || '创建主题失败')
    } finally {
      setPending(false)
    }
  }

  const writeReadyTopics = async () => {
    const ready = prepared.filter(({ cluster }) => clusterQualifiesForTopic(cluster).ok)
    if (ready.length === 0) {
      messageApi.warning('还没有可写入的主题（每组至少两条证据、两个来源）')
      return
    }
    setPending(true)
    try {
      for (const item of ready) {
        const created = await createTheme({
          working_name: item.displayName.slice(0, 120),
          value_chain_stage_code: item.induction.valueChainStageCode,
        })
        for (const signal of reliableClusterSignals(item.cluster)) {
          await putSignalTheme(signal.id, {
            tech_theme_id: created.id,
            expected_updated_at: signal.updated_at,
          })
        }
      }
      await invalidateAll()
      messageApi.success(`已写成 ${ready.length} 个主题`)
      onNavigate('topics')
    } catch (err) {
      const detail = eeaErrorMessage(err)
      messageApi.error(detail || '创建主题失败')
    } finally {
      setPending(false)
    }
  }

  const openEstablishModal = async (proposal: ThemeClusterProposal, cluster: TagCluster, suggestedName: string) => {
    const gate = clusterQualifiesForTopic(cluster)
    if (!gate.ok) {
      messageApi.warning(gate.reason)
      return
    }
    setActiveKey(proposal.key)
    setFormingKey(proposal.key)
    if (!reducedMotion()) await wait(720)
    setFormingKey(null)
    setNamingCluster({ cluster, name: suggestedName })
  }

  const errorText =
    clusterReportError instanceof EeaApiError
      ? clusterReportError.message
      : clusterReportError instanceof Error
        ? clusterReportError.message
        : null

  return (
    <Card className="panel-card" title="自动整理 · 标签收成主题">
      <Paragraph type="secondary">
        当前留存信号按<strong>库内技术方向标签</strong>做成向量。标签先散开，再按余弦距离收成若干主题，确认后才写入。
      </Paragraph>

      <div className="topic-forge-metrics" aria-busy={clusterReportLoading}>
        <div>
          <span>未归集样本</span>
          <strong>{clusterReport ? clusterReport.unassigned_count : '—'}</strong>
        </div>
        <div>
          <span>候选主题</span>
          <strong>{clusterReport ? clusterReport.clusters.length : '—'}</strong>
        </div>
        <div>
          <span>轮廓系数</span>
          <strong>{clusterReport?.silhouette == null ? '—' : clusterReport.silhouette.toFixed(2)}</strong>
        </div>
        <div>
          <span>在用标签</span>
          <strong>{clusterReport ? clusterReport.tag_distribution.length : vocabRows.length}</strong>
        </div>
      </div>

      <TopicClusterStage
        tags={stageTags}
        clusters={stageClusters}
        phase={phase}
        formingKey={formingKey}
        activeKey={activeKey}
      />

      <Flex justify="space-between" align="center" gap={12} wrap className="topic-forge-legend">
        <Text type="secondary">
          {clusterReport
            ? `方法 ${clusterReport.method}，${clusterReport.linkage} 连接，${clusterReport.metric} 距离阈值 ${clusterReport.distance_threshold}。`
            : '正在读取库内标签。'}
          凝聚度是组内平均余弦相似度，提升度是组内占比除以全样本占比。
          {clusterReport ? ` 相似度对照 ${clusterReport.sample_size} 条已留存信号。` : ''}
          {clusterReport?.truncated ? ' 样本已截取最近 800 条。' : ''}
        </Text>
        <Space>
          <Button size="small" icon={<ReloadOutlined />} onClick={() => setReplayToken((value) => value + 1)}>
            重放聚类
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            disabled={pending || phase !== 'formed' || prepared.every(({ cluster }) => !clusterQualifiesForTopic(cluster).ok)}
            onClick={() => void writeReadyTopics()}
          >
            写成可建主题
          </Button>
        </Space>
      </Flex>

      {errorText ? <Text type="danger">{errorText}</Text> : null}

      {phase !== 'formed' ? (
        <Text type="secondary">标签正在收拢，收成之后再列出主题。</Text>
      ) : !clusterReportLoading && clusterReport && prepared.length === 0 ? (
        <Text type="secondary">
          这次没有收成可展示的主题（多条证据需要两个来源，且组内平均余弦不低于 0.5）。可以换手动整理，先点一条再纳入相近信号。
        </Text>
      ) : phase === 'formed' ? (
        <Row gutter={[16, 16]} className="topic-candidate-grid is-formed">
          {prepared.map(({ proposal, cluster, induction, displayName, stageLabel }, index) => {
            const gate = clusterQualifiesForTopic(cluster)
            const alreadyAssigned =
              proposal.members.length > 0 && proposal.members.every((member) => member.assigned)
            const mergeName =
              induction.mergeTarget && !alreadyAssigned
                ? themes?.find((theme) => theme.id === induction.mergeTarget?.themeId)?.working_name
                : null
            const holdReason =
              proposal.signal_count < 2
                ? '这一组目前只有 1 条证据，补上第二条后再写成主题。'
                : proposal.source_count < 2
                  ? '这一组只有一个来源站点，补上第二个来源后再写成主题。'
                  : gate.reason
            return (
              <Col xs={24} xl={12} key={proposal.key}>
                <Card
                  size="small"
                  className={activeKey === proposal.key ? 'topic-candidate-card is-active' : 'topic-candidate-card'}
                  style={{ animationDelay: `${index * 90}ms` }}
                  variant="borderless"
                  onMouseEnter={() => setActiveKey(proposal.key)}
                >
                  <Flex justify="space-between" align="flex-start" gap="middle" wrap>
                    <Flex vertical gap={6} style={{ flex: 1, minWidth: 0 }}>
                      <Text strong className="topic-candidate-title">
                        {displayName}
                      </Text>
                      <Text type="secondary" className="topic-candidate-meta">
                        {proposal.signal_count} 条 · {proposal.source_count} 来源 · 凝聚度{' '}
                        {Math.round(proposal.cohesion * 100)}%
                        {stageLabel ? ` · ${stageLabel}` : ''}
                      </Text>
                    </Flex>
                    <Space wrap className="topic-candidate-actions">
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        disabled={pending || !gate.ok}
                        onClick={() => void openEstablishModal(proposal, cluster, displayName)}
                      >
                        收成主题
                      </Button>
                      {induction.mergeTarget && mergeName ? (
                        <Button
                          size="small"
                          icon={<MergeCellsOutlined />}
                          disabled={pending}
                          onClick={() => void assignToTheme(cluster, induction.mergeTarget!.themeId)}
                        >
                          并入「{mergeName}」
                        </Button>
                      ) : null}
                    </Space>
                  </Flex>
                  <div className="topic-lift-list">
                    {proposal.tag_distribution.slice(0, 4).map((item) => (
                      <div key={item.tag} className="topic-lift-row">
                        <span className="topic-lift-name">{item.tag}</span>
                        <span className="topic-lift-track" aria-hidden>
                          <span style={{ width: `${Math.round(item.cluster_share * 100)}%` }} />
                        </span>
                        <span className="topic-lift-num">{item.lift.toFixed(2)}×</span>
                      </div>
                    ))}
                  </div>
                  {gate.ok ? null : (
                    <Text type="secondary" className="topic-candidate-meta">
                      {holdReason}
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
              </Col>
            )
          })}
        </Row>
      ) : null}

      <Modal
        title="确认主题工作名"
        open={namingCluster !== null}
        confirmLoading={pending}
        onCancel={() => setNamingCluster(null)}
        onOk={() => {
          if (!namingCluster) return
          const induction = induceTopicFromCluster(namingCluster.cluster, themeTagMap)
          void establishAsNewTopic(
            namingCluster.cluster,
            namingCluster.name.trim(),
            induction.valueChainStageCode,
          )
        }}
        okText="创建主题"
        cancelText="取消"
      >
        <Input
          value={namingCluster?.name ?? ''}
          onChange={(event) =>
            setNamingCluster((prev) => (prev ? { ...prev, name: event.target.value } : null))
          }
          maxLength={120}
          showCount
        />
      </Modal>
    </Card>
  )
}
