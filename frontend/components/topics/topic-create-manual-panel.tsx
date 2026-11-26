'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { App as AntApp, Button, Card, Input, Select, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { TableRowSelection } from 'antd/es/table/interface'
import { createTheme, putSignalTheme, suggestThemeName } from '@/lib/api/eea-api'
import { eeaErrorMessage } from '@/lib/api/client'
import { useTopicClusterCandidates } from '@/hooks/use-topic-cluster-candidates'
import { useRefCodeMaps } from '@/hooks/use-eea-queries'
import { labelFor, shortStageLabel } from '@/lib/eea-mappers'
import { signalFromClusterMember } from '@/lib/topic-cluster-report'
import {
  dedupeTags,
  isReliableTopicEvidence,
  proposeNaturalTopicName,
} from '@/lib/topic-clustering'
import type { SignalNeighborOut, SignalOut } from '@/lib/api/types'
import type { NavigateFn } from '@/types/platform'

const { Text, Paragraph } = Typography

function tagsForSignals(signals: SignalOut[]): string[] {
  return dedupeTags(signals.flatMap((signal) => signal.tags ?? [])).slice(0, 8)
}

function majorityStage(signals: SignalOut[]): string | undefined {
  const counts = new Map<string, number>()
  for (const signal of signals) {
    const code = signal.value_chain_stage_code
    if (!code) continue
    counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  let best: string | undefined
  let bestCount = 0
  for (const [code, count] of counts) {
    if (count > bestCount) {
      best = code
      bestCount = count
    }
  }
  return best
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function TopicCreateManualPanel({ onNavigate }: { onNavigate: NavigateFn }) {
  const { message: messageApi } = AntApp.useApp()
  const { maps } = useRefCodeMaps()
  const { signals, signalsLoading, clusterReport, clusterReportLoading, invalidateAll } =
    useTopicClusterCandidates()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [anchorId, setAnchorId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [stage, setStage] = useState<string | undefined>()
  const [stageTouched, setStageTouched] = useState(false)
  const [llmName, setLlmName] = useState<string | null>(null)
  const [remoteStage, setRemoteStage] = useState<string | null>(null)
  const [naming, setNaming] = useState(false)
  const [onlyUnassigned, setOnlyUnassigned] = useState(true)
  const [forming, setForming] = useState(false)
  const formingTimer = useRef<number | null>(null)
  const namingRequest = useRef(0)

  useEffect(() => {
    return () => {
      if (formingTimer.current != null) window.clearTimeout(formingTimer.current)
    }
  }, [])

  useEffect(() => {
    namingRequest.current += 1
    const requestId = namingRequest.current
    setNaming(false)
    setLlmName(null)
    setRemoteStage(null)

    if (selectedIds.length === 0) return

    const delay = reducedMotion() ? 0 : 480
    const timer = window.setTimeout(() => {
      setNaming(true)
      suggestThemeName(selectedIds)
        .then((result) => {
          if (requestId !== namingRequest.current) return
          const next = result.working_name.trim()
          if (next) setLlmName(next.slice(0, 120))
          setRemoteStage(result.value_chain_stage_code)
        })
        .catch(() => {
          if (requestId !== namingRequest.current) return
        })
        .finally(() => {
          if (requestId === namingRequest.current) setNaming(false)
        })
    }, delay)

    return () => window.clearTimeout(timer)
  }, [messageApi, selectedIds])

  const signalById = useMemo(() => {
    const map = new Map<string, SignalOut>()
    for (const signal of signals) map.set(signal.id, signal)
    for (const cluster of clusterReport?.clusters ?? []) {
      for (const member of cluster.members) {
        if (!map.has(member.signal_id)) map.set(member.signal_id, signalFromClusterMember(member))
      }
    }
    for (const neighbors of Object.values(clusterReport?.neighbors ?? {})) {
      for (const neighbor of neighbors) {
        if (!map.has(neighbor.signal_id)) map.set(neighbor.signal_id, signalFromClusterMember(neighbor))
      }
    }
    return map
  }, [signals, clusterReport])

  const pool = useMemo(() => {
    return signals.filter((signal) => {
      if (onlyUnassigned && signal.tech_theme_id) return false
      return isReliableTopicEvidence(signal)
    })
  }, [signals, onlyUnassigned])

  const selected = useMemo(
    () => selectedIds.map((id) => signalById.get(id)).filter((signal): signal is SignalOut => Boolean(signal)),
    [selectedIds, signalById],
  )

  const suggestions = useMemo((): SignalNeighborOut[] => {
    if (!anchorId || !clusterReport) return []
    const chosen = new Set(selectedIds)
    return (clusterReport.neighbors[anchorId] ?? []).filter((neighbor) => {
      if (chosen.has(neighbor.signal_id)) return false
      if (onlyUnassigned && neighbor.assigned) return false
      const known = signalById.get(neighbor.signal_id)
      if (onlyUnassigned && known?.tech_theme_id) return false
      return true
    })
  }, [anchorId, clusterReport, onlyUnassigned, selectedIds, signalById])

  const anchor = anchorId ? signalById.get(anchorId) : undefined
  const liveTags = useMemo(() => tagsForSignals(selected), [selected])
  const stageOptions = useMemo(
    () => Object.entries(maps.byDomain.value_chain_stage ?? {}).map(([value, label]) => ({ value, label })),
    [maps],
  )
  const localStage = useMemo(() => majorityStage(selected), [selected])
  const localName = useMemo(() => {
    if (selected.length === 0) return ''
    const stageLabel = localStage ? shortStageLabel(labelFor(maps, 'value_chain_stage', localStage)) : null
    return proposeNaturalTopicName(selected, liveTags, stageLabel)
  }, [selected, liveTags, localStage, maps])
  const suggestionName = (llmName ?? localName).trim()
  const suggestionStage = remoteStage ?? localStage
  const suggestionStageLabel = suggestionStage
    ? shortStageLabel(labelFor(maps, 'value_chain_stage', suggestionStage))
    : ''
  const effectiveName = name.trim() || suggestionName
  const effectiveStage = stageTouched ? (stage ?? null) : (suggestionStage ?? null)

  const generateName = () => {
    if (naming || selectedIds.length === 0) return
    const requestId = ++namingRequest.current
    setNaming(true)
    suggestThemeName(selectedIds)
      .then((result) => {
        if (requestId !== namingRequest.current) return
        const next = result.working_name.trim()
        if (next) {
          setLlmName(next.slice(0, 120))
          if (!nameTouched) setName('')
        }
        setRemoteStage(result.value_chain_stage_code)
      })
      .catch((err) => {
        if (requestId !== namingRequest.current) return
        messageApi.error(eeaErrorMessage(err, '主题名生成失败'))
      })
      .finally(() => {
        if (requestId === namingRequest.current) setNaming(false)
      })
  }

  const rowSelection: TableRowSelection<SignalOut> = {
    selectedRowKeys: selectedIds,
    onChange: (keys) => {
      const next = keys.map(String)
      const added = next.find((id) => !selectedIds.includes(id))
      setSelectedIds(next)
      if (added) setAnchorId(added)
      else if (anchorId && !next.includes(anchorId)) setAnchorId(next.at(-1) ?? null)
    },
  }

  const adopt = (ids: string[]) => {
    setSelectedIds((current) => {
      const seen = new Set(current)
      const next = [...current]
      for (const id of ids) {
        if (seen.has(id)) continue
        seen.add(id)
        next.push(id)
      }
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const created = await createTheme({
        working_name: effectiveName.slice(0, 120),
        value_chain_stage_code: effectiveStage,
      })
      for (const signal of selected) {
        await putSignalTheme(signal.id, {
          tech_theme_id: created.id,
          expected_updated_at: signal.updated_at,
        })
      }
      return created
    },
    onSuccess: async () => {
      await invalidateAll()
      messageApi.success(`已创建主题并关联 ${selected.length} 条信号`)
      onNavigate('topics')
    },
    onError: (err) => {
      setForming(false)
      messageApi.error(eeaErrorMessage(err, '创建失败'))
    },
  })

  const formTopic = () => {
    if (forming || mutation.isPending || selected.length === 0 || !effectiveName) return
    setForming(true)
    const delay = reducedMotion() ? 0 : 860
    formingTimer.current = window.setTimeout(() => {
      mutation.mutate()
    }, delay)
  }

  return (
    <Card className="panel-card" title="手动整理 · 选一条，带出一组">
      <Paragraph type="secondary">
        勾选一条信号后，右侧按同一套余弦相似度建议可一起归入的证据。主题由你最终留下的全部信号收成。
      </Paragraph>
      <div className="topic-manual-layout">
        <div className="topic-manual-table">
          <Space wrap style={{ marginBottom: 12 }}>
            <Button type={onlyUnassigned ? 'primary' : 'default'} onClick={() => setOnlyUnassigned(true)}>
              仅未归集
            </Button>
            <Button type={!onlyUnassigned ? 'primary' : 'default'} onClick={() => setOnlyUnassigned(false)}>
              全部可归纳信号
            </Button>
            <Text type="secondary">已选 {selected.length} 条</Text>
          </Space>
          <Table<SignalOut>
            rowKey="id"
            size="small"
            loading={signalsLoading}
            dataSource={pool}
            rowSelection={rowSelection}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            scroll={{ x: 720 }}
            rowClassName={(row) => {
              if (row.id === anchorId) return 'topic-row-anchor'
              if (suggestions.some((item) => item.signal_id === row.id)) return 'topic-row-suggested'
              return ''
            }}
            columns={[
              { title: '信号', dataIndex: 'title', ellipsis: true },
              {
                title: '技术方向（当前）',
                dataIndex: 'tags',
                render: (tags: string[] | undefined) =>
                  tags?.length ? (
                    <Space wrap size={4}>
                      {tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </Space>
                  ) : (
                    <Text type="secondary">无标签</Text>
                  ),
              },
              {
                title: '环节',
                dataIndex: 'value_chain_stage_code',
                width: 100,
                render: (code: string | null) =>
                  code ? shortStageLabel(labelFor(maps, 'value_chain_stage', code)) : '—',
              },
            ]}
          />
        </div>
        <aside className="topic-suggest-rail" aria-live="polite">
          <Text strong>相近信号</Text>
          <Paragraph type="secondary" className="topic-suggest-lead">
            {anchor
              ? `以「${anchor.title}」为锚，列出标签向量最接近、且尚未勾选的证据。`
              : '点一条信号。这里会列出和它标签最接近的未归集证据。'}
          </Paragraph>
          {clusterReportLoading ? <Text type="secondary">正在计算相似度…</Text> : null}
          {!clusterReportLoading && anchor && suggestions.length === 0 ? (
            <Text type="secondary">没有足够接近的信号。可以继续勾选，或换一条标签更完整的证据。</Text>
          ) : null}
          <div className="topic-suggest-list">
            {suggestions.map((neighbor) => (
              <article key={neighbor.signal_id} className="topic-suggest-card">
                <div className="topic-suggest-card-head">
                  <Text ellipsis>{neighbor.title}</Text>
                  <span className="topic-suggest-score">{Math.round(neighbor.similarity * 100)}%</span>
                </div>
                <Space wrap size={4}>
                  {neighbor.assigned ? <Tag>已在主题中</Tag> : null}
                  {neighbor.shared_tags.map((tag) => (
                    <Tag key={tag} color="processing">
                      {tag}
                    </Tag>
                  ))}
                </Space>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => adopt([neighbor.signal_id])}
                >
                  纳入
                </Button>
              </article>
            ))}
          </div>
          {suggestions.length > 0 ? (
            <Button block type="primary" onClick={() => adopt(suggestions.map((item) => item.signal_id))}>
              纳入这组（{suggestions.length}）
            </Button>
          ) : null}
        </aside>
      </div>

      <div className={forming ? 'topic-form-dock is-forming' : 'topic-form-dock'}>
        <div className="topic-form-core">
          <Text type="secondary">将收成</Text>
          <Text>
            {selected.length === 0
              ? '先选择信号，主题名会出现在输入框里'
              : '建议名在输入框中，环节留空则采用建议环节，两者都可以改'}
          </Text>
        </div>
        <div className="topic-selected-chips">
          {selected.length === 0 ? (
            <Text type="secondary">还没有信号</Text>
          ) : (
            selected.slice(0, 8).map((signal) => (
              <span key={signal.id} className="topic-selected-chip">
                {signal.title}
              </span>
            ))
          )}
          {selected.length > 8 ? <Text type="secondary">等 {selected.length} 条</Text> : null}
        </div>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Input
            className="topic-name-field"
            placeholder={suggestionName || '主题工作名'}
            value={name}
            onChange={(event) => {
              setNameTouched(true)
              setName(event.target.value)
            }}
            maxLength={120}
            showCount
            suffix={
              <Button
                className="topic-name-ai"
                type="link"
                size="small"
                icon={<ThunderboltOutlined />}
                loading={naming}
                disabled={selected.length === 0}
                onMouseDown={(event) => event.preventDefault()}
                onClick={generateName}
              >
                AI
              </Button>
            }
          />
          <Select
            allowClear
            style={{ width: '100%' }}
            placeholder={suggestionStageLabel ? `建议：${suggestionStageLabel}` : '价值链环节（可选）'}
            value={stage}
            options={stageOptions}
            onChange={(value) => {
              setStageTouched(true)
              setStage(value)
            }}
          />
          {liveTags.length ? (
            <Space wrap size={4}>
              <Text type="secondary">所选标签：</Text>
              {liveTags.map((tag) => (
                <Tag key={tag} color="blue">
                  {tag}
                </Tag>
              ))}
            </Space>
          ) : null}
          <Space>
            <Button
              type="primary"
              disabled={selected.length === 0 || !effectiveName}
              loading={forming || mutation.isPending}
              onClick={formTopic}
            >
              收成主题
            </Button>
            <Button onClick={() => onNavigate('topics')}>取消</Button>
          </Space>
        </Space>
      </div>
    </Card>
  )
}
