'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Spin, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { fetchSignalStudio } from '@/lib/api/eea-api'
import { eeaErrorMessage } from '@/lib/api/client'
import type {
  StudioInfographicPayload,
  StudioMindmapPayload,
} from '@/lib/api/types'
import { SignalBodyMarkdown } from '@/components/evidence/signal-body-markdown'
import { StudioMindmap } from '@/components/evidence/studio-mindmap'
import { PlatformEmptyState } from '@/components/shared/empty-state'

const { Text, Title, Paragraph } = Typography

type StudioPaneKind = 'mindmap' | 'report' | 'infographic'

type EvidenceStudioPaneProps = {
  signalId: string | null
  kind: StudioPaneKind
  /** When false, do not auto-fetch (evidence studio mounts all panes; only the active tab should hit the LLM). */
  fetchEnabled?: boolean
  cached: string | StudioMindmapPayload | StudioInfographicPayload | undefined
  onLoaded: (payload: string | StudioMindmapPayload | StudioInfographicPayload) => void
  onInvalidate?: () => void
}

function MindmapView({ data }: { data: StudioMindmapPayload }) {
  return (
    <div className="evidence-studio-mindmap">
      <StudioMindmap data={data} />
    </div>
  )
}

function InfographicView({ data }: { data: StudioInfographicPayload }) {
  return (
    <div className="evidence-studio-infographic">
      <Title level={3}>{data.headline}</Title>
      {data.stats?.length ? (
        <div className="evidence-infographic-stats">
          {data.stats.map((stat) => (
            <div key={stat.label} className="evidence-infographic-stat">
              <Text type="secondary">{stat.label}</Text>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
      <div className="evidence-infographic-points">
        {data.points?.map((point) => (
          <div key={point.title} className="evidence-infographic-point">
            <Text strong>{point.title}</Text>
            <Paragraph type="secondary">{point.body}</Paragraph>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EvidenceStudioPane({
  signalId,
  kind,
  fetchEnabled = true,
  cached,
  onLoaded,
  onInvalidate,
}: EvidenceStudioPaneProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchGeneration, setFetchGeneration] = useState(0)
  const onLoadedRef = useRef(onLoaded)
  onLoadedRef.current = onLoaded

  const runFetch = useCallback(async () => {
    if (!signalId) return
    setLoading(true)
    setError(null)
    try {
      const payload = await fetchSignalStudio(signalId, kind, {
        regenerate: fetchGeneration > 0,
      })
      onLoadedRef.current(payload as string | StudioMindmapPayload | StudioInfographicPayload)
    } catch (err) {
      setError(eeaErrorMessage(err, '生成失败'))
    } finally {
      setLoading(false)
    }
  }, [signalId, kind, fetchGeneration])

  useEffect(() => {
    setError(null)
    setLoading(false)
  }, [signalId, kind])

  useEffect(() => {
    if (!signalId || !fetchEnabled) return
    if (cached !== undefined && fetchGeneration === 0) return
    void runFetch()
  }, [signalId, kind, fetchEnabled, cached, fetchGeneration, runFetch])

  const handleRegenerate = () => {
    onInvalidate?.()
    setFetchGeneration((g) => g + 1)
  }

  if (!signalId) {
    return (
      <PlatformEmptyState
        title="需要已入库信号"
        description="请从证据库打开带正文快照的信号后再生成工作室内容。"
      />
    )
  }

  if (loading && cached === undefined && !error) {
    return (
      <div className="evidence-studio-loading">
        <Spin />
        <Text type="secondary">正在生成…</Text>
      </div>
    )
  }

  const renderCached = () => {
    if (cached === undefined) return null
    if (kind === 'report' && typeof cached === 'string') {
      return <SignalBodyMarkdown markdown={cached} className="evidence-markdown-article evidence-studio-report" />
    }
    if (kind === 'mindmap' && typeof cached === 'object' && 'children' in cached) {
      return <MindmapView data={cached} />
    }
    if (kind === 'infographic' && typeof cached === 'object' && 'headline' in cached) {
      return <InfographicView data={cached} />
    }
    return null
  }

  if (error) {
    if (cached !== undefined) {
      const body = renderCached()
      if (body) {
        return (
          <div className="evidence-studio-with-stale">
            <Alert
              type="warning"
              showIcon
              title="本次生成失败"
              description={error}
              action={
                <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={handleRegenerate}>
                  重新生成
                </Button>
              }
            />
            {body}
          </div>
        )
      }
    }
    return (
      <PlatformEmptyState
        title="生成失败"
        description={error}
        action={
          <Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={handleRegenerate}>
            重新生成
          </Button>
        }
      />
    )
  }

  if (cached === undefined) {
    return (
      <div className="evidence-studio-loading">
        <Spin />
      </div>
    )
  }

  const successBody = renderCached()
  if (successBody) {
    return successBody
  }

  return (
    <PlatformEmptyState
      title="无法解析生成结果"
      description="响应结构与当前客户端不一致，请重试或检查模型配置。"
      action={
        <Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={handleRegenerate}>
          重新生成
        </Button>
      }
    />
  )
}
