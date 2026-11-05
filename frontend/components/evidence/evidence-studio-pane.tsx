'use client'

import { useEffect, useRef, useState } from 'react'
import { Spin, Typography } from 'antd'
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
  cached: string | StudioMindmapPayload | StudioInfographicPayload | undefined
  onLoaded: (payload: string | StudioMindmapPayload | StudioInfographicPayload) => void
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

export function EvidenceStudioPane({ signalId, kind, cached, onLoaded }: EvidenceStudioPaneProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onLoadedRef = useRef(onLoaded)
  onLoadedRef.current = onLoaded
  const fetchFinishedRef = useRef(false)

  useEffect(() => {
    fetchFinishedRef.current = false
    setError(null)
    setLoading(false)
  }, [signalId, kind])

  useEffect(() => {
    if (!signalId || cached !== undefined) {
      if (cached !== undefined) fetchFinishedRef.current = true
      return
    }
    if (fetchFinishedRef.current) return
    let cancelled = false
    setLoading(true)
    void fetchSignalStudio(signalId, kind)
      .then((payload) => {
        if (cancelled) return
        fetchFinishedRef.current = true
        onLoadedRef.current(payload as string | StudioMindmapPayload | StudioInfographicPayload)
      })
      .catch((err) => {
        if (cancelled) return
        fetchFinishedRef.current = true
        if (err instanceof EeaApiError && isNotFound(err.status)) {
          setError('not_wired')
          return
        }
        setError(err instanceof EeaApiError ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [signalId, kind, cached])

  if (!signalId) {
    return (
      <PlatformEmptyState
        title="需要已入库信号"
        description="请从证据库打开带正文快照的信号后再生成工作室内容。"
      />
    )
  }

  if (loading && cached === undefined) {
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

  if (error) {
    return <PlatformEmptyState title="生成失败" description={error} />
  }

  if (cached === undefined) {
    return (
      <div className="evidence-studio-loading">
        <Spin />
      </div>
    )
  }

  if (kind === 'report' && typeof cached === 'string') {
    return <SignalBodyMarkdown markdown={cached} className="evidence-markdown-article evidence-studio-report" />
  }

  if (kind === 'mindmap' && typeof cached === 'object' && 'children' in cached) {
    return <MindmapView data={cached} />
  }

  if (kind === 'infographic' && typeof cached === 'object' && 'headline' in cached) {
    return <InfographicView data={cached} />
  }

  return <PlatformEmptyState title="无法解析生成结果" description="请在后端接入 studio 接口后重试。" />
}
