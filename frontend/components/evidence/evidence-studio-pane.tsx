'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Spin, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { fetchSignalStudio } from '@/lib/api/eea-api'
import { EeaApiError } from '@/lib/api/client'
import type {
  StudioInfographicPayload,
  StudioMindmapNode,
  StudioMindmapPayload,
} from '@/lib/api/types'
import { SignalBodyMarkdown } from '@/components/evidence/signal-body-markdown'
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

function isNotFound(status: number) {
  return status === 404 || status === 501 || status === 405
}

function MindmapTree({ node, depth = 0 }: { node: StudioMindmapNode; depth?: number }) {
  const children = node.children ?? []
  return (
    <li className={`evidence-mindmap-node depth-${Math.min(depth, 3)}`}>
      <span className="evidence-mindmap-label">{node.label}</span>
      {children.length > 0 ? (
        <ul className="evidence-mindmap-children">
          {children.map((child, index) => (
            <MindmapTree key={`${depth}-${index}-${child.label}`} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function MindmapView({ data }: { data: StudioMindmapPayload }) {
  return (
    <div className="evidence-studio-mindmap">
      <Title level={4}>{data.title}</Title>
      <ul className="evidence-mindmap-root">
        {data.children.map((child, index) => (
          <MindmapTree key={`root-${index}-${child.label}`} node={child} depth={0} />
        ))}
      </ul>
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
      const payload = await fetchSignalStudio(signalId, kind)
      onLoadedRef.current(payload as string | StudioMindmapPayload | StudioInfographicPayload)
    } catch (err) {
      if (err instanceof EeaApiError && isNotFound(err.status)) {
        setError('not_wired')
        return
      }
      setError(err instanceof EeaApiError ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [signalId, kind, cached])

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

  if (error === 'not_wired') {
    return (
      <PlatformEmptyState
        title="工作室生成尚未接入"
        description="后端需实现 POST /signals/{id}/studio，契约见 backend/TODO.md §八。"
      />
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

  if (error && error !== 'not_wired') {
    if (cached !== undefined) {
      const body = renderCached()
      if (body) {
        return (
          <div className="evidence-studio-with-stale">
            <Alert
              type="warning"
              showIcon
              message="本次生成失败"
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
      description="请在后端接入 studio 接口后重试。"
      action={
        <Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={handleRegenerate}>
          重新生成
        </Button>
      }
    />
  )
}
