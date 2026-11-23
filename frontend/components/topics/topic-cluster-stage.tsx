'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, Flex, Space, Typography } from 'antd'
import { CompressOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons'
import { clusterHue } from '@/lib/topic-cluster-palette'
import type { ThemeClusterMap, ThemeClusterTagPoint } from '@/lib/api/types'

const { Text } = Typography

export type StageCluster = {
  key: string
  label: string
  tags: string[]
  tagSources?: Record<string, string[]>
}

export type ClusterStagePhase = 'scatter' | 'gather' | 'formed'

type StageMotion = 'scatter' | 'settling' | 'formed'

const SCATTER_HOLD_MS = 380
const SETTLE_MS = 760
const FORMED_AT_MS = SCATTER_HOLD_MS + SETTLE_MS + 120

/** One marker radius for every tag, in canvas units (canvas is 220x100). */
const DOT_RADIUS = 0.85

export function TopicClusterStage({
  clusters,
  map,
  formingKey,
  activeKey,
  onClusterFocus,
  actions,
  replayToken = 0,
}: {
  clusters: StageCluster[]
  /** Fully laid-out map from the backend: coordinates, regions, cluster keys. */
  map?: ThemeClusterMap | null
  formingKey?: string | null
  activeKey?: string | null
  onClusterFocus?: (clusterKey: string) => void
  actions?: ReactNode
  replayToken?: number
}) {
  const [zoom, setZoom] = useState(1)
  const [selectedPoint, setSelectedPoint] = useState<ThemeClusterTagPoint | null>(null)
  const [motion, setMotion] = useState<StageMotion>('formed')
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const points = map?.points ?? []
  const regions = map?.regions ?? []
  const width = map?.width ?? 220
  const height = map?.height ?? 100
  const focusKey = hoveredRegion ?? activeKey

  const clusterMeta = useMemo(() => {
    const out = new Map<string, StageCluster>()
    clusters.forEach((cluster) => out.set(cluster.key, cluster))
    return out
  }, [clusters])

  const signature = points.map((point) => point.tag).join('|')

  useEffect(() => {
    if (!signature) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMotion('formed')
      return
    }
    setMotion('scatter')
    const settleAt = window.setTimeout(() => setMotion('settling'), SCATTER_HOLD_MS)
    const formedAt = window.setTimeout(() => setMotion('formed'), FORMED_AT_MS)
    return () => {
      window.clearTimeout(settleAt)
      window.clearTimeout(formedAt)
    }
  }, [signature, replayToken])

  const popoverFor = (point: ThemeClusterTagPoint) => {
    const cluster = point.cluster_key ? clusterMeta.get(point.cluster_key) : undefined
    const sources = cluster?.tagSources?.[point.tag] ?? []
    return (
      <div className="topic-scatter-popover">
        {point.cluster_key ? (
          <Text type="secondary" className="topic-scatter-popover-cluster">
            {cluster?.label || '候选主题'}
          </Text>
        ) : (
          <Text type="secondary">未归入候选聚类</Text>
        )}
        <Text className="topic-scatter-popover-tag">{point.tag}</Text>
        {sources.length > 0 ? (
          <>
            <div className="topic-scatter-popover-label">来源站点</div>
            <ul>
              {sources.map((host) => (
                <li key={host}>{host}</li>
              ))}
            </ul>
          </>
        ) : (
          <Text type="secondary">暂无来源记录</Text>
        )}
        {point.cluster_key ? (
          <Button
            type="link"
            size="small"
            className="topic-scatter-popover-link"
            onClick={() => onClusterFocus?.(point.cluster_key!)}
          >
            定位下方候选卡片
          </Button>
        ) : null}
      </div>
    )
  }

  const scatteredPosition = (point: ThemeClusterTagPoint, index: number) => {
    // Deterministic pseudo-random start so replay looks the same each time.
    const h = (index * 2654435761) % 1000
    return {
      x: 4 + (h / 1000) * (width - 8),
      y: 4 + (((h * 7919) % 1000) / 1000) * (height - 8),
    }
  }

  return (
    <div className="topic-forge-stage topic-forge-stage--map">
      <div className="topic-forge-toolbar">
        <Text type="secondary" className="topic-forge-toolbar-meta">
          {points.length} 标签 · {regions.length} 聚类 · 坐标由后端计算
        </Text>
        <Space size={8} wrap>
          {actions}
          <Space size={4}>
            <Button
              size="small"
              icon={<ZoomOutOutlined />}
              aria-label="缩小"
              onClick={() => setZoom((value) => Math.max(0.7, value - 0.15))}
            />
            <span className="topic-forge-zoom-readout">{Math.round(zoom * 100)}%</span>
            <Button
              size="small"
              icon={<ZoomInOutlined />}
              aria-label="放大"
              onClick={() => setZoom((value) => Math.min(2.2, value + 0.15))}
            />
            <Button size="small" icon={<CompressOutlined />} aria-label="重置缩放" onClick={() => setZoom(1)} />
          </Space>
        </Space>
      </div>

      <div ref={scrollRef} className="topic-forge-viewport">
        {points.length === 0 ? (
          <div className="topic-forge-empty">
            没有可渲染的聚类图。若后端刚更新，请重启 backend 以返回 <code>tag_map</code>。
          </div>
        ) : (
          <div className="topic-forge-canvas-shell" style={{ aspectRatio: `${width} / ${height}` }}>
            <svg
              className="topic-forge-map"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ transform: `scale(${zoom})` }}
              role="img"
              aria-label={`标签聚类图，${points.length} 个标签，${regions.length} 个聚类`}
            >
              <defs>
                {regions.map((region) => {
                  const hue = clusterHue(region.index)
                  const active = focusKey === region.cluster_key
                  const strong = active ? 0.34 : 0.18
                  // objectBoundingBox units (the SVG default) map the gradient to the
                  // ellipse's own box, so the fade reaches zero exactly at the edge —
                  // no hard cut where rx and ry differ.
                  return (
                    <radialGradient
                      id={`topic-cluster-glow-${region.index}`}
                      key={region.cluster_key}
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <stop offset="0%" stopColor={`hsl(${hue} 54% 46%)`} stopOpacity={strong} />
                      <stop offset="28%" stopColor={`hsl(${hue} 52% 50%)`} stopOpacity={strong * 0.72} />
                      <stop offset="52%" stopColor={`hsl(${hue} 50% 55%)`} stopOpacity={strong * 0.4} />
                      <stop offset="74%" stopColor={`hsl(${hue} 46% 60%)`} stopOpacity={strong * 0.16} />
                      <stop offset="89%" stopColor={`hsl(${hue} 42% 64%)`} stopOpacity={strong * 0.05} />
                      <stop offset="100%" stopColor={`hsl(${hue} 40% 66%)`} stopOpacity="0" />
                    </radialGradient>
                  )
                })}
              </defs>

              {regions.map((region) => {
                const dimmed = focusKey != null && focusKey !== region.cluster_key
                const active = focusKey === region.cluster_key
                const cluster = clusterMeta.get(region.cluster_key)
                const title = cluster?.label?.trim() || region.label || '未命名主题'
                // Fit the label to the ellipse: CJK glyphs are ~1 font-size wide.
                const maxChars = Math.max(5, Math.floor((region.rx * 2.2) / 2.5))
                const shown = title.length > maxChars ? `${title.slice(0, maxChars - 1)}…` : title
                const labelY = region.cy + region.ry * 0.95
                // 54 always-on captions read as noise; show the bigger families
                // plus whatever the reader is pointing at.
                const showTitle = active || region.count >= 6
                // Small families would otherwise render as a sliver of colour.
                const glowX = Math.max(region.rx * 1.35, 5.5)
                const glowY = Math.max(region.ry * 1.35, 4)
                return (
                  <g
                    key={region.cluster_key}
                    className={['topic-map-region', dimmed ? 'is-dimmed' : ''].filter(Boolean).join(' ')}
                    onMouseEnter={() => setHoveredRegion(region.cluster_key)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <ellipse
                      cx={region.cx}
                      cy={region.cy}
                      rx={glowX}
                      ry={glowY}
                      fill={`url(#topic-cluster-glow-${region.index})`}
                      onClick={() => onClusterFocus?.(region.cluster_key)}
                    />
                    {showTitle ? (
                      <g
                        className="topic-map-region-title"
                        onClick={() => onClusterFocus?.(region.cluster_key)}
                      >
                        <title>{`${title}（${region.count} 个标签）`}</title>
                        <text x={region.cx} y={labelY} textAnchor="middle">
                          {shown}
                        </text>
                      </g>
                    ) : null}
                  </g>
                )
              })}

              {points.map((point, index) => {
                const dimmed = focusKey != null && point.cluster_key !== focusKey
                const hue = point.cluster_index != null ? clusterHue(point.cluster_index) : null
                const scatter = scatteredPosition(point, index)
                const inScatter = motion === 'scatter'
                // One marker size for every tag: the colour and the cluster glow
                // already carry the grouping, so size variation only adds noise.
                const radius = DOT_RADIUS
                const fillAlpha = point.assigned ? 0.9 : 0.45
                return (
                  <g
                    key={point.tag}
                    className={[
                      'topic-map-point',
                      inScatter ? 'is-scatter' : '',
                      motion === 'settling' ? 'is-settling' : '',
                      dimmed ? 'is-dimmed' : '',
                      point.assigned ? '' : 'is-noise',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ transitionDelay: `${(index % 24) * 22}ms` }}
                  >
                    <g
                      className="topic-map-hit"
                      role="button"
                      tabIndex={0}
                      transform={`translate(${inScatter ? scatter.x : point.x} ${inScatter ? scatter.y : point.y})`}
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedPoint(point)
                        if (point.cluster_key) onClusterFocus?.(point.cluster_key)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedPoint(point)
                          if (point.cluster_key) onClusterFocus?.(point.cluster_key)
                        }
                      }}
                    >
                      <title>{point.tag}</title>
                      <circle r={radius * 2.8} fill="transparent" className="topic-map-hit-area" />
                      <circle
                        r={radius}
                        fill={hue == null ? 'var(--eea-text-secondary)' : `hsl(${hue} 44% 46%)`}
                        fillOpacity={fillAlpha}
                        stroke={hue == null ? 'none' : `hsl(${hue} 40% 34%)`}
                        strokeWidth={hue == null ? 0 : 0.18}
                      />
                      <text className="topic-map-point-label" x={radius + 0.6} y={radius * 0.7}>
                        {point.tag}
                      </text>
                    </g>
                  </g>
                )
              })}
            </svg>
          </div>
        )}
      </div>

      {selectedPoint ? (
        <div className="topic-map-tag-detail" aria-live="polite">
          <Flex justify="space-between" align="flex-start" gap={12} wrap>
            {popoverFor(selectedPoint)}
            <Button size="small" type="text" onClick={() => setSelectedPoint(null)} aria-label="关闭标签详情">
              关闭
            </Button>
          </Flex>
        </div>
      ) : (
        <Text type="secondary" className="topic-map-tag-hint">
          点击图中的标签查看来源站点，并定位下方候选卡片。
        </Text>
      )}
    </div>
  )
}