'use client'

import { useMemo, useState } from 'react'
import {
  App as AntApp,
  Button,
  Card,
  Col,
  Collapse,
  Flex,
  Input,
  Modal,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import { ClusterOutlined, CheckOutlined, MergeCellsOutlined, RobotOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTheme,
  fetchSignals,
  fetchSignalTagSuggestions,
  putSignalTags,
  putSignalTheme,
} from '@/lib/api/eea-api'
import { EeaApiError } from '@/lib/api/client'
import { eeaQueryKeys, useRefCodeMaps } from '@/hooks/use-eea-queries'
import {
  buildThemeTagMap,
  clusterQualifiesForTopic,
  clusterUnassignedSignals,
  dedupeEvidenceTitles,
  induceTopicFromCluster,
  proposeNaturalTopicName,
  reliableClusterSignals,
  type TagCluster,
} from '@/lib/topic-clustering'
import type { ThemeDetail } from '@/lib/api/types'
import type { NavigateFn } from '@/types/platform'
import { labelFor, shortStageLabel } from '@/lib/eea-mappers'

const { Text, Paragraph } = Typography

type TopicClusteringPanelProps = {
  themes: ThemeDetail[] | undefined
  onNavigate: NavigateFn
}

export function TopicClusteringPanel({ themes, onNavigate }: TopicClusteringPanelProps) {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const { maps } = useRefCodeMaps()
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number; label: string } | null>(null)
  const [namingCluster, setNamingCluster] = useState<{ cluster: TagCluster; name: string } | null>(null)

  const signalsQuery = useQuery({
    queryKey: eeaQueryKeys.signals({ limit: 200 }),
    queryFn: () => fetchSignals({ limit: 200 }),
  })

  const signals = signalsQuery.data ?? []
  const themeTagMap = useMemo(() => buildThemeTagMap(themes ?? []), [themes])

  const clusters = useMemo(() => clusterUnassignedSignals(signals), [signals])

  const candidates = useMemo(() => {
    return clusters.map((cluster) => {
      const induction = induceTopicFromCluster(cluster, themeTagMap)
      const stageLabel = induction.valueChainStageCode
        ? shortStageLabel(labelFor(maps, 'value_chain_stage', induction.valueChainStageCode))
        : null
      const displayName = proposeNaturalTopicName(
        reliableClusterSignals(cluster),
        induction.attributionTags,
        stageLabel,
      )
      const evidenceHints = dedupeEvidenceTitles(reliableClusterSignals(cluster), 3)
      return { cluster, induction, displayName, stageLabel, evidenceHints }
    })
  }, [clusters, themeTagMap, maps])

  const stats = useMemo(() => {
    const unassigned = signals.filter((s) => !s.tech_theme_id && !s.document_id)
    const noTags = signals.filter((s) => !s.document_id && !(s.tags?.length ?? 0))
    return {
      total: signals.length,
      unassigned: unassigned.length,
      noTags: noTags.length,
      candidateTopics: candidates.length,
    }
  }, [signals, candidates.length])

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['eea', 'signals'] })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.themes })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.vocabUsage })
  }

  const runBatchSuggestTags = useMutation({
    mutationFn: async () => {
      const targets = signals.filter((s) => !s.document_id && !(s.tags?.length ?? 0))
      const capped = targets.slice(0, 30)
      setBatchProgress({ done: 0, total: capped.length, label: '环节二 · 机器预标' })
      let ok = 0
      for (let i = 0; i < capped.length; i++) {
        const s = capped[i]
        const suggestion = await fetchSignalTagSuggestions(s.id)
        if (suggestion.suggested_tags.length) {
          await putSignalTags(s.id, {
            tag_names: suggestion.suggested_tags,
            expected_updated_at: s.updated_at,
          })
          ok++
        }
        setBatchProgress({ done: i + 1, total: capped.length, label: '环节二 · 机器预标' })
      }
      return { ok, total: capped.length }
    },
    onSuccess: (result) => {
      void invalidateAll()
      setBatchProgress(null)
      messageApi.success(`技术方向标签已写入 ${result.ok} 条信号`)
    },
    onError: () => {
      setBatchProgress(null)
      messageApi.error('标签预标失败')
    },
  })

  const assignToTheme = async (cluster: TagCluster, themeId: string) => {
    const gate = clusterQualifiesForTopic(cluster)
    if (!gate.ok) {
      messageApi.warning(gate.reason)
      return
    }
    try {
      for (const s of reliableClusterSignals(cluster)) {
        await putSignalTheme(s.id, {
          tech_theme_id: themeId,
          expected_updated_at: s.updated_at,
        })
      }
      await invalidateAll()
      messageApi.success(`已将 ${reliableClusterSignals(cluster).length} 条证据归入主题`)
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '归集失败')
    }
  }

  const establishAsNewTopic = async (cluster: TagCluster, workingName: string, stageCode: string | null) => {
    try {
      const created = await createTheme({
        working_name: workingName.slice(0, 120),
        value_chain_stage_code: stageCode,
      })
      await assignToTheme(cluster, created.id)
      setNamingCluster(null)
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '创建主题失败')
    }
  }

  const openEstablishModal = (cluster: TagCluster, suggestedName: string) => {
    const gate = clusterQualifiesForTopic(cluster)
    if (!gate.ok) {
      messageApi.warning(gate.reason)
      return
    }
    setNamingCluster({ cluster, name: suggestedName })
  }

  const busy = runBatchSuggestTags.isPending || Boolean(batchProgress)

  return (
    <Card
      className="panel-card topic-clustering-card"
      title={
        <Space>
          <ClusterOutlined />
          标签归总 · 归纳主题
        </Space>
      }
    >
      <Paragraph type="secondary" className="topic-clustering-intro">
        环节三：相似标签向上归总 → 需求抽象命名。仅计入<strong>已留存</strong>且非验证页/抓取失败的证据；确立主题需
        <strong> ≥2 条可靠证据</strong>且<strong> ≥2 个不同来源站点</strong>。
      </Paragraph>

      <Row gutter={16} className="summary-row" style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Statistic title="样本信号" value={stats.total} suffix="/ 200" />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="待归纳" value={stats.unassigned} styles={{ content: { color: '#d97706' } }} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="待标标签" value={stats.noTags} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="候选主题" value={stats.candidateTopics} />
        </Col>
      </Row>

      {batchProgress ? (
        <Progress
          percent={Math.round((batchProgress.done / batchProgress.total) * 100)}
          format={() => `${batchProgress.label} ${batchProgress.done}/${batchProgress.total}`}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {signalsQuery.isLoading ? (
        <Text type="secondary">加载证据信号…</Text>
      ) : candidates.length === 0 ? (
        <Text type="secondary">
          尚无满足条件的候选主题（需多来源、已留存、非验证页）。请补充可靠证据与标签，或核对抓取失败的链接。
        </Text>
      ) : (
        <Row gutter={[16, 16]} className="topic-candidate-grid">
          {candidates.map(({ cluster, induction, displayName, stageLabel, evidenceHints }) => {
            const mergeName = induction.mergeTarget
              ? themes?.find((t) => t.id === induction.mergeTarget?.themeId)?.working_name
              : null

            return (
              <Col xs={24} xl={12} key={cluster.key}>
                <Card size="small" className="topic-candidate-card" variant="borderless">
                  <Flex justify="space-between" align="flex-start" gap="middle" wrap>
                    <Flex vertical gap={6} style={{ flex: 1, minWidth: 0 }}>
                      <Text strong className="topic-candidate-title">
                        {displayName}
                      </Text>
                      <Text type="secondary" className="topic-candidate-meta">
                        {induction.signalCount} 条证据
                        {induction.sourceCount > 0 ? ` · ${induction.sourceCount} 个来源` : ''}
                        {stageLabel ? ` · ${stageLabel}` : ''}
                      </Text>
                    </Flex>
                    <Space wrap className="topic-candidate-actions">
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        disabled={busy}
                        onClick={() => openEstablishModal(cluster, displayName)}
                      >
                        确立为主题
                      </Button>
                      {induction.mergeTarget && mergeName ? (
                        <Button
                          size="small"
                          icon={<MergeCellsOutlined />}
                          disabled={busy}
                          onClick={() => void assignToTheme(cluster, induction.mergeTarget!.themeId)}
                        >
                          并入「{mergeName}」
                        </Button>
                      ) : null}
                    </Space>
                  </Flex>
                  <Space wrap size={4} className="topic-candidate-tags">
                    {induction.attributionTags.map((tag) => (
                      <Tag key={tag} color="processing">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                  {evidenceHints.length ? (
                    <ul className="topic-candidate-evidence">
                      {evidenceHints.map((title) => (
                        <li key={title}>
                          <Text type="secondary" ellipsis>
                            {title}
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
      )}

      <Collapse
        ghost
        style={{ marginTop: 8 }}
        items={[
          {
            key: 'prep',
            label: '环节二 · 数据准备（机器预标技术方向）',
            children: (
              <Space>
                <Button
                  icon={<RobotOutlined />}
                  loading={runBatchSuggestTags.isPending}
                  disabled={busy || stats.noTags === 0}
                  onClick={() => void runBatchSuggestTags.mutate()}
                >
                  批量采纳标签建议（最多 30 条）
                </Button>
                <Text type="secondary">标签就绪后，本页自动刷新候选主题。</Text>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title="需求抽象 · 确认主题工作名"
        open={namingCluster !== null}
        onCancel={() => setNamingCluster(null)}
        onOk={() => {
          if (!namingCluster) return
          const induction = induceTopicFromCluster(namingCluster.cluster, themeTagMap)
          void establishAsNewTopic(namingCluster.cluster, namingCluster.name.trim(), induction.valueChainStageCode)
        }}
        okText="确立为主题"
        cancelText="取消"
      >
        <Paragraph type="secondary">
          主题工作名来自标签向上归总与需求抽象命名；确认后将关联本簇全部证据。
        </Paragraph>
        <Input
          value={namingCluster?.name ?? ''}
          onChange={(e) => setNamingCluster((prev) => (prev ? { ...prev, name: e.target.value } : null))}
          maxLength={120}
          showCount
        />
      </Modal>
    </Card>
  )
}
