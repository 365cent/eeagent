'use client'

import { useEffect, useMemo, useState } from 'react'
import { App as AntApp, Button, Card, Col, Flex, Input, Modal, Row, Typography } from 'antd'
import { CheckOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { createTheme, putSignalTheme, suggestThemeName } from '@/lib/api/eea-api'
import { EeaApiError, eeaErrorMessage } from '@/lib/api/client'
import { TopicCandidateCard } from '@/components/topics/topic-candidate-card'
import { TopicClusterStage, type ClusterStagePhase } from '@/components/topics/topic-cluster-stage'
import { useTopicClusterCandidates } from '@/hooks/use-topic-cluster-candidates'
import { useRefCodeMaps } from '@/hooks/use-eea-queries'
import { labelFor, shortStageLabel } from '@/lib/eea-mappers'
import { proposalToCluster } from '@/lib/topic-cluster-report'
import {
  clusterQualifiesForTopic,
  topicCreationGate,
  induceTopicFromCluster,
  proposeNaturalTopicName,
  reliableClusterSignals,
  topicClusterEvidenceStats,
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

function tagSourcesForProposal(proposal: ThemeClusterProposal): Record<string, string[]> {
  const hosts = new Map<string, Set<string>>()
  for (const member of proposal.members) {
    const host = (member.source_host || '').trim() || '未知来源'
    for (const tag of member.tags) {
      const bucket = hosts.get(tag) ?? new Set<string>()
      bucket.add(host)
      hosts.set(tag, bucket)
    }
  }
  return Object.fromEntries(
    [...hosts.entries()].map(([tag, set]) => [tag, [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'))]),
  )
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
    recomputeClustering,
    recomputeBusy,
    invalidateAll,
  } = useTopicClusterCandidates()
  const [namingCluster, setNamingCluster] = useState<{ cluster: TagCluster; name: string } | null>(null)
  const [namingAi, setNamingAi] = useState(false)
  const [pending, setPending] = useState(false)
  const [replayToken, setReplayToken] = useState(0)
  const [phase, setPhase] = useState<ClusterStagePhase>('scatter')
  const [formingKey, setFormingKey] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const prepared = useMemo(() => {
    return (clusterReport?.clusters ?? []).map((proposal) => {
      const cluster = proposalToCluster(proposal)
      const stageLabel = proposal.value_chain_stage_code
        ? shortStageLabel(labelFor(maps, 'value_chain_stage', proposal.value_chain_stage_code))
        : null
      const attribution = proposal.shared_tags.length
        ? proposal.shared_tags
        : proposal.tag_distribution.map((item) => item.tag)
      // The AI title wins when the last clustering pass managed to name this
      // cluster; the tag/title name stays as the fallback.
      const displayName =
        (proposal.ai_name && proposal.ai_name.trim()) ||
        proposeNaturalTopicName(cluster.signals, attribution, stageLabel)
      const induction = induceTopicFromCluster(cluster, themeTagMap)
      const evidence = topicClusterEvidenceStats(cluster)
      return { proposal, cluster, stageLabel, displayName, induction, evidence }
    })
  }, [clusterReport, maps, themeTagMap])

  const creatable = useMemo(
    () => prepared.filter(({ cluster }) => clusterQualifiesForTopic(cluster).ok),
    [prepared],
  )

  const stageClusters = useMemo(
    () =>
      prepared.map(({ proposal, displayName }) => ({
        key: proposal.key,
        label: displayName,
        tags: proposal.tag_distribution.map((item) => item.tag),
        tagSources: tagSourcesForProposal(proposal),
      })),
    [prepared],
  )

  const stageSignature = `${replayToken}|${stageClusters.map((item) => item.key).join(',')}`

  useEffect(() => {
    if (stageClusters.length === 0 || reducedMotion()) {
      setPhase('formed')
      return
    }
    setPhase('scatter')
    const gatherAt = window.setTimeout(() => setPhase('gather'), 420)
    const formedAt = window.setTimeout(() => setPhase('formed'), 1400)
    return () => {
      window.clearTimeout(gatherAt)
      window.clearTimeout(formedAt)
    }
  }, [stageSignature, stageClusters.length])

  const replayClustering = async () => {
    try {
      await recomputeClustering()
      setReplayToken((value) => value + 1)
      messageApi.success('聚类已更新')
    } catch (err) {
      messageApi.error(eeaErrorMessage(err, '聚类更新失败'))
    }
  }

  const assignToTheme = async (cluster: TagCluster, themeId: string) => {
    const creation = topicCreationGate(cluster)
    if (!creation.canCreate) {
      messageApi.warning(creation.reason)
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
    const ready = creatable
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

  const modalSignalIds = useMemo(() => {
    if (!namingCluster) return []
    return reliableClusterSignals(namingCluster.cluster).map((signal) => signal.id)
  }, [namingCluster])

  const generateModalName = () => {
    if (namingAi || modalSignalIds.length === 0) return
    setNamingAi(true)
    suggestThemeName(modalSignalIds)
      .then((result) => {
        const next = result.working_name.trim()
        if (next) {
          setNamingCluster((prev) => (prev ? { ...prev, name: next.slice(0, 120) } : null))
        }
      })
      .catch((err) => {
        messageApi.error(eeaErrorMessage(err, '主题名生成失败'))
      })
      .finally(() => setNamingAi(false))
  }

  const beginEstablishFlow = async (
    proposal: ThemeClusterProposal,
    cluster: TagCluster,
    suggestedName: string,
  ) => {
    setActiveKey(proposal.key)
    setFormingKey(proposal.key)
    if (!reducedMotion()) await wait(720)
    setFormingKey(null)
    setNamingCluster({ cluster, name: suggestedName })
  }

  const openEstablishModal = (proposal: ThemeClusterProposal, cluster: TagCluster, suggestedName: string) => {
    const creation = topicCreationGate(cluster)
    if (!creation.canCreate) {
      messageApi.warning(creation.reason)
      return
    }
    if (creation.tier === 'provisional') {
      Modal.confirm({
        title: '预建主题',
        content: creation.reason,
        okText: '创建主题',
        cancelText: '取消',
        onOk: () => beginEstablishFlow(proposal, cluster, suggestedName),
      })
      return
    }
    void beginEstablishFlow(proposal, cluster, suggestedName)
  }

  const errorText =
    clusterReportError instanceof EeaApiError
      ? clusterReportError.message
      : clusterReportError instanceof Error
        ? clusterReportError.message
        : null

  return (
    <Card className="panel-card" title="自动整理 · 标签创建主题">
      <Paragraph type="secondary">
        当前留存信号按<strong>库内技术方向标签</strong>做成向量。标签先散开，再按余弦距离收成若干主题，确认后才写入。
      </Paragraph>
      {clusterReport?.pending ? (
        <Text type="secondary" className="topic-cluster-pending">
          新信号已入库，聚类在后台更新…
        </Text>
      ) : null}

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
        clusters={stageClusters}
        map={clusterReport?.tag_map}
        formingKey={formingKey}
        activeKey={activeKey}
        onClusterFocus={setActiveKey}
        replayToken={replayToken}
        actions={
          <>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={recomputeBusy}
              disabled={recomputeBusy}
              onClick={() => void replayClustering()}
            >
              {recomputeBusy ? '聚类更新中…' : '重放聚类'}
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              disabled={pending || phase !== 'formed' || creatable.length === 0}
              onClick={() => void writeReadyTopics()}
            >
              写成可建主题
            </Button>
          </>
        }
      />

      <Flex justify="space-between" align="center" gap={12} wrap className="topic-forge-legend">
        <Text type="secondary">
          {clusterReport
            ? `层次聚类（${clusterReport.method} · ${clusterReport.linkage} · ${clusterReport.metric}，阈值 ${clusterReport.distance_threshold}）。`
            : '正在读取库内标签。'}
          坐标与分组均由后端计算：MDS 投影后按聚类网格排布，组间不重叠；同色点属同一候选聚类。下方卡片可「创建主题」；达到 2 条可计证据且 2 个来源的为「可建主题」，仅 1 条时可「预建主题」。点击圆点查看来源。
          {clusterReport ? ` 样本 ${clusterReport.sample_size} 条已留存信号。` : ''}
          {clusterReport?.truncated ? ' 已截取最近 800 条。' : ''}
        </Text>
      </Flex>

      {errorText ? <Text type="danger">{errorText}</Text> : null}

      {phase !== 'formed' ? (
        <Text type="secondary">标签正在收拢，收成之后再列出候选主题。</Text>
      ) : prepared.length === 0 ? (
        <Text type="secondary">
          这次没有收成分组。可以换手动整理，先点一条再纳入相近信号。
        </Text>
      ) : (
        <>
          {creatable.length === 0 ? (
            <Text type="secondary" className="topic-candidate-note">
              当前没有「可建主题」分组（需 2 条可计证据、2 个来源）。仍可对「预建主题」卡片创建主题，或换手动整理纳入相近信号。
            </Text>
          ) : null}
          <Row gutter={[16, 16]} className="topic-candidate-grid is-formed">
            {prepared.map(({ proposal, cluster, induction, displayName, stageLabel, evidence }, index) => {
              const mergeName =
                induction.mergeTarget
                  ? themes?.find((theme) => theme.id === induction.mergeTarget?.themeId)?.working_name
                  : null
              return (
                <Col xs={24} xl={12} key={proposal.key}>
                  <TopicCandidateCard
                    proposal={proposal}
                    cluster={cluster}
                    induction={induction}
                    displayName={displayName}
                    namePending={Boolean(clusterReport?.pending)}
                    stageLabel={stageLabel}
                    index={index}
                    active={activeKey === proposal.key}
                    pending={pending}
                    mergeName={mergeName}
                    creationTier={evidence.creation.tier}
                    canCreate={evidence.creation.canCreate}
                    creationReason={evidence.creation.reason}
                    reliableCount={evidence.reliableCount}
                    reliableSources={evidence.reliableSources}
                    onFocus={() => setActiveKey(proposal.key)}
                    onEstablish={() => openEstablishModal(proposal, cluster, displayName)}
                    onMerge={() => void assignToTheme(cluster, induction.mergeTarget!.themeId)}
                  />
                </Col>
              )
            })}
          </Row>
        </>
      )}

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
          className="topic-name-field"
          placeholder="主题工作名"
          value={namingCluster?.name ?? ''}
          onChange={(event) =>
            setNamingCluster((prev) => (prev ? { ...prev, name: event.target.value } : null))
          }
          maxLength={120}
          showCount
          suffix={
            <Button
              className="topic-name-ai"
              type="link"
              size="small"
              icon={<ThunderboltOutlined />}
              loading={namingAi}
              disabled={modalSignalIds.length === 0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={generateModalName}
            >
              AI
            </Button>
          }
        />
      </Modal>
    </Card>
  )
}
