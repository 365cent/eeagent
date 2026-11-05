'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Tag, Typography, theme } from 'antd'

const { Text, Title } = Typography

type SegmentId = 'create' | 'transfer' | 'deliver' | 'regulate'

type RadarNode = {
  id: string
  label: string
  radarLabel: string
  segment: SegmentId
  angle: number
  radius: number
  color: string
  chain: boolean
  impact: string
  impactScore: string
  action: string
  actionScore: string
  horizon: string
  horizonScore: string
  detail: string
}

type RadarLink = { from: string; to: string; emphasis?: boolean }

const RADAR_TOP_PAD = 132
const RADAR_BOTTOM_PAD = 28
const RADAR_MAX_RADIUS = 500

const SEGMENTS: { id: SegmentId; label: string; color: string; wedge: string; start: number; end: number }[] = [
  { id: 'create', label: '创造端', color: '#e85d4c', wedge: 'rgba(232, 93, 76, 0.05)', start: -Math.PI, end: -Math.PI * 0.75 },
  { id: 'transfer', label: '传递端', color: '#4f86e8', wedge: 'rgba(79, 134, 232, 0.05)', start: -Math.PI * 0.75, end: -Math.PI * 0.5 },
  { id: 'deliver', label: '兑现端', color: '#3fae6b', wedge: 'rgba(63, 174, 107, 0.05)', start: -Math.PI * 0.5, end: -Math.PI * 0.25 },
  { id: 'regulate', label: '规制端', color: '#8b5cf6', wedge: 'rgba(139, 92, 246, 0.05)', start: -Math.PI * 0.25, end: 0 },
]

const RING_RATIOS = [0.3, 0.5, 0.7, 0.85, 1]
const RING_CAPTIONS = ['0–1 年', '1–2 年', '3–4 年', '5–7 年']

const SEGMENT_COLOR: Record<SegmentId, string> = {
  create: '#e85d4c',
  transfer: '#4f86e8',
  deliver: '#3fae6b',
  regulate: '#8b5cf6',
}

function ratio(text: string) {
  const match = text.match(/([\d.]+)\s*\/\s*([\d.]+)/)
  if (!match) return 0.4
  return Math.min(1, Math.max(0, Number(match[1]) / Number(match[2])))
}

function node(
  id: string,
  label: string,
  radarLabel: string,
  segment: SegmentId,
  angleDeg: number,
  radius: number,
  chain: boolean,
  meta: { impact: string; impactScore: string; action: string; actionScore: string; horizon: string; horizonScore: string; detail: string },
): RadarNode {
  return { id, label, radarLabel, segment, angle: (angleDeg * Math.PI) / 180, radius, color: SEGMENT_COLOR[segment], chain, ...meta }
}

const RADAR_NODES: RadarNode[] = [
  node('signal', '48V 低压供电网络研究', '48V 供电网络', 'create', -172, 0.8, true, { impact: '高', impactScore: '4.2/5', action: '继续归集', actionScore: '2.6/3', horizon: '0–2 年', horizonScore: '4/5', detail: '与非网 · 2026-06 · 置信度 0.94' }),
  node('s1', '混合供电架构', '混合供电', 'create', -163, 0.48, false, { impact: '中', impactScore: '3.1/5', action: '观察', actionScore: '1.8/3', horizon: '2–4 年', horizonScore: '3/5', detail: '48V/12V 区域混合配电' }),
  node('s2', 'DC-DC 转换效率', 'DC-DC', 'create', -156, 0.9, false, { impact: '中', impactScore: '3.4/5', action: '观察', actionScore: '2/3', horizon: '1–3 年', horizonScore: '4/5', detail: '供应链效率信号' }),
  node('parse', '区域化、可诊断、可降级', '证据解析', 'create', -148, 0.64, true, { impact: '高', impactScore: '4.5/5', action: '交叉验证', actionScore: '2.8/3', horizon: '1–3 年', horizonScore: '3/5', detail: 'MarkItDown 结构化快照' }),
  node('s7', '48V 供应链活跃度', '供应链', 'create', -140, 0.72, false, { impact: '中', impactScore: '3/5', action: '补录来源', actionScore: '2/3', horizon: '2–3 年', horizonScore: '3/5', detail: '创造端器件供给' }),

  node('s3', '功能安全分区', '功能安全', 'transfer', -130, 0.78, false, { impact: '高', impactScore: '4/5', action: '纳入主题', actionScore: '2.5/3', horizon: '2–5 年', horizonScore: '2/5', detail: 'ASIL 分解约束' }),
  node('topic', '低压系统智能化', '主题归集', 'transfer', -122, 0.56, true, { impact: '很高', impactScore: '4.8/5', action: '映射需求', actionScore: '2.9/3', horizon: '2–4 年', horizonScore: '3/5', detail: '16 条证据 · 8 个来源' }),
  node('s4', 'eFuse 诊断能力', 'eFuse', 'transfer', -114, 0.66, false, { impact: '高', impactScore: '4.3/5', action: '深化', actionScore: '2.6/3', horizon: '3–5 年', horizonScore: '2/5', detail: '智能保险丝案例锚点' }),
  node('s8', '区域控制器平台', '区域控制器', 'transfer', -106, 0.86, false, { impact: '很高', impactScore: '4.6/5', action: '对齐平台', actionScore: '2.7/3', horizon: '3–5 年', horizonScore: '2/5', detail: '主机厂集成路径' }),
  node('s9', '车载芯片供给', '车载芯片', 'transfer', -98, 0.44, false, { impact: '中', impactScore: '3.3/5', action: '跟踪', actionScore: '1.9/3', horizon: '2–4 年', horizonScore: '3/5', detail: '传递端产能信号' }),

  node('s5', '功率半导体健康', 'Si 健康', 'deliver', -84, 0.72, false, { impact: '中', impactScore: '3.6/5', action: '补录', actionScore: '2.2/3', horizon: '4–6 年', horizonScore: '2/5', detail: '当前证据缺口' }),
  node('demand', '主动配电与故障隔离', '需求点', 'deliver', -78, 0.5, true, { impact: '很高', impactScore: '4.6/5', action: '落地评估', actionScore: '2.7/3', horizon: '3–5 年', horizonScore: '2/5', detail: '已交叉验证 · 12 条信号' }),
  node('s10', '智能保险丝量产', 'eFuse 量产', 'deliver', -66, 0.76, false, { impact: '高', impactScore: '4.1/5', action: '样件验证', actionScore: '2.4/3', horizon: '4–6 年', horizonScore: '2/5', detail: '兑现端量产节奏' }),
  node('landing', '区域控制器 + 智能保险丝', '技术落脚点', 'deliver', -58, 0.4, true, { impact: '极高', impactScore: '5/5', action: '补录证据', actionScore: '2.4/3', horizon: '4–6 年', horizonScore: '2/5', detail: '待补录功率半导体健康监测' }),
  node('s11', '全冗余配电架构', '冗余配电', 'deliver', -48, 0.58, false, { impact: '高', impactScore: '4.2/5', action: '评审', actionScore: '2.3/3', horizon: '3–5 年', horizonScore: '2/5', detail: '安全与可用性权衡' }),

  node('s6', 'ISO 26262 对齐', 'ISO 26262', 'regulate', -40, 0.6, false, { impact: '中', impactScore: '3.2/5', action: '对齐', actionScore: '2.1/3', horizon: '规制', horizonScore: '3/5', detail: '功能安全规制约束' }),
  node('s12', 'ASPICE 流程要求', 'ASPICE', 'regulate', -32, 0.78, false, { impact: '中', impactScore: '3/5', action: '对齐', actionScore: '2/3', horizon: '规制', horizonScore: '3/5', detail: '研发流程要求' }),
  node('s13', '数据与网络安全', '数据安全', 'regulate', -23, 0.46, false, { impact: '中', impactScore: '3.5/5', action: '跟踪', actionScore: '2/3', horizon: '规制', horizonScore: '3/5', detail: '法规与合规要求' }),
  node('s14', '碳排与循环要求', '碳排', 'regulate', -14, 0.84, false, { impact: '低', impactScore: '2.6/5', action: '观察', actionScore: '1.6/3', horizon: '规制', horizonScore: '3/5', detail: '长期规制信号' }),
  node('s15', '供应链合规审查', '合规审查', 'regulate', -6, 0.68, false, { impact: '低', impactScore: '2.8/5', action: '观察', actionScore: '1.7/3', horizon: '规制', horizonScore: '3/5', detail: '准入与审查要求' }),
]

const RADAR_LINKS: RadarLink[] = [
  { from: 'signal', to: 'parse', emphasis: true },
  { from: 'parse', to: 'topic', emphasis: true },
  { from: 'topic', to: 'demand', emphasis: true },
  { from: 'demand', to: 'landing', emphasis: true },
  { from: 'signal', to: 's1' },
  { from: 'signal', to: 's7' },
  { from: 'parse', to: 's2' },
  { from: 'topic', to: 's3' },
  { from: 'topic', to: 's4' },
  { from: 'topic', to: 's8' },
  { from: 'demand', to: 's5' },
  { from: 'demand', to: 's11' },
  { from: 'landing', to: 's10' },
  { from: 'landing', to: 's6' },
]

const CHAIN_IDS = RADAR_NODES.filter((item) => item.chain).map((item) => item.id)
const NODE_MAP = new Map(RADAR_NODES.map((item) => [item.id, item]))

type Geometry = { width: number; height: number; cx: number; cy: number; radius: number }

function computeGeometry(width: number): Geometry {
  const safeWidth = Math.max(width, 320)
  const radius = Math.min(safeWidth * 0.4, RADAR_MAX_RADIUS)
  const height = Math.round(radius + RADAR_TOP_PAD + RADAR_BOTTOM_PAD)
  const cy = height - RADAR_BOTTOM_PAD
  return { width: safeWidth, height, cx: safeWidth / 2, cy, radius }
}

function pointAt(geo: Geometry, angle: number, dist: number) {
  return { x: geo.cx + Math.cos(angle) * dist * geo.radius, y: geo.cy + Math.sin(angle) * dist * geo.radius }
}

function wedgePath(geo: Geometry, start: number, end: number) {
  const a = pointAt(geo, start, 1)
  const b = pointAt(geo, end, 1)
  return `M ${geo.cx} ${geo.cy} L ${a.x} ${a.y} A ${geo.radius} ${geo.radius} 0 0 1 ${b.x} ${b.y} Z`
}

function arcPath(geo: Geometry, ratioValue: number, start: number, end: number) {
  const a = pointAt(geo, start, ratioValue)
  const b = pointAt(geo, end, ratioValue)
  return `M ${a.x} ${a.y} A ${geo.radius * ratioValue} ${geo.radius * ratioValue} 0 0 1 ${b.x} ${b.y}`
}

function sizeOf(item: RadarNode, active: boolean) {
  return (item.chain ? 6.5 : 4.6) + (active ? 1.8 : 0)
}

function ScoreBar({ value, color, inactiveColor }: { value: number; color: string; inactiveColor: string }) {
  return (
    <div className="deduction-radar-score" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} style={{ background: index < Math.round(value * 5) ? color : inactiveColor }} />
      ))}
    </div>
  )
}

export function DeductionChainRadar() {
  const { token } = theme.useToken()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [selectedId, setSelectedId] = useState('landing')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showAllLabels, setShowAllLabels] = useState(true)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: RadarNode } | null>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const sync = () => {
      const next = wrap.clientWidth
      if (next > 0) setWidth(next)
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [])

  const geo = useMemo(() => computeGeometry(width), [width])
  const selected = NODE_MAP.get(selectedId) ?? RADAR_NODES[0]
  const activeId = hoveredId ?? selectedId
  const segmentLabel = SEGMENTS.find((segment) => segment.id === selected.segment)?.label ?? ''
  const ringStroke = token.colorBorderSecondary
  const ringStrokeOuter = token.colorBorder
  const captionFill = token.colorTextQuaternary
  const labelActive = token.colorText
  const labelChain = token.colorTextSecondary
  const labelMuted = token.colorTextQuaternary
  const labelLine = token.colorBorderSecondary
  const nodeStroke = token.colorBgContainer
  const nodeStrokeActive = token.colorText
  const scoreInactive = token.colorFillSecondary
  const selectedWedgeFill = `${token.colorPrimary}14`
  const linkHot = token.colorPrimary
  const linkEmphasis = `${token.colorPrimary}52`
  const linkDefault = token.colorFillSecondary

  const labelRow = new Map<string, number>()
  const perSegment = new Map<SegmentId, number>()
  for (const item of RADAR_NODES) {
    const count = perSegment.get(item.segment) ?? 0
    labelRow.set(item.id, count)
    perSegment.set(item.segment, count + 1)
  }

  const findNode = (clientX: number, clientY: number) => {
    const wrap = wrapRef.current
    if (!wrap) return null
    const rect = wrap.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    let hit: RadarNode | null = null
    let best = Number.POSITIVE_INFINITY
    for (const item of RADAR_NODES) {
      const pos = pointAt(geo, item.angle, item.radius)
      const distance = Math.hypot(x - pos.x, y - pos.y)
      if (distance < best && distance <= sizeOf(item, false) + 9) {
        hit = item
        best = distance
      }
    }
    return hit ? { node: hit, x, y } : null
  }

  return (
    <div className="deduction-radar-shell">
      <div className="deduction-radar-toolbar">
        <Text type="secondary">
          <span className="deduction-radar-count">20 个元素</span> · 悬停查看，点击切换
        </Text>
        <Button size="small" type={showAllLabels ? 'primary' : 'default'} ghost={showAllLabels} onClick={() => setShowAllLabels((value) => !value)}>
          {showAllLabels ? '仅看推导链' : '显示全部标签'}        </Button>
      </div>

      <div className="deduction-radar-layout">
        <div
          ref={wrapRef}
          className="deduction-radar-canvas"
          style={width > 0 ? { minHeight: geo.height } : undefined}
          onPointerMove={(event) => {
            const found = findNode(event.clientX, event.clientY)
            setHoveredId(found?.node.id ?? null)
            setTooltip(found ? { x: found.x, y: found.y, node: found.node } : null)
          }}
          onPointerLeave={() => {
            setHoveredId(null)
            setTooltip(null)
          }}
          onClick={(event) => {
            const found = findNode(event.clientX, event.clientY)
            if (found) setSelectedId(found.node.id)
          }}
        >
          {width > 0 && (
            <svg className="deduction-radar-svg" viewBox={`0 0 ${geo.width} ${geo.height}`} width={geo.width} height={geo.height} role="img" aria-label="推导链雷达">
              <defs>
                <filter id="radar-glow" x="-70%" y="-70%" width="240%" height="240%">
                  <feGaussianBlur stdDeviation="2.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {SEGMENTS.map((segment) => (
                <path
                  key={`wedge-${segment.id}`}
                  d={wedgePath(geo, segment.start, segment.end)}
                  fill={segment.id === selected.segment ? selectedWedgeFill : segment.wedge}
                />
              ))}

              {RING_RATIOS.map((value) => (
                <path key={`ring-${value}`} d={arcPath(geo, value, -Math.PI, 0)} fill="none" stroke={value === 1 ? ringStrokeOuter : ringStroke} strokeWidth={value === 1 ? 1.4 : 1} />
              ))}

              {SEGMENTS.map((segment) => {
                const mid = (segment.start + segment.end) / 2
                const pos = pointAt(geo, mid, 0.92)
                return (
                  <text
                    key={`seg-${segment.id}`}
                    x={pos.x}
                    y={pos.y}
                    fill={segment.color}
                    fontSize={10}
                    fontWeight={600}
                    letterSpacing="0.1em"
                    textAnchor="middle"
                    transform={`rotate(${(mid * 180) / Math.PI + 90} ${pos.x} ${pos.y})`}
                    opacity={0.85}
                  >
                    {segment.label}
                  </text>
                )
              })}

              {RING_CAPTIONS.map((caption, index) => (
                <text key={caption} x={geo.cx + 6} y={geo.cy - geo.radius * RING_RATIOS[index] - 4} fill={captionFill} fontSize={9}>
                  {caption}
                </text>
              ))}

              {SEGMENTS.map((segment) => (
                <path
                  key={`rim-${segment.id}`}
                  d={arcPath(geo, 1, segment.start, segment.end)}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={4}
                  opacity={segment.id === selected.segment ? 0.9 : 0.35}
                />
              ))}

              {RADAR_LINKS.map((link) => {
                const from = NODE_MAP.get(link.from)
                const to = NODE_MAP.get(link.to)
                if (!from || !to) return null
                const a = pointAt(geo, from.angle, from.radius)
                const b = pointAt(geo, to.angle, to.radius)
                const hot = link.from === activeId || link.to === activeId
                return (
                  <path
                    key={`${link.from}-${link.to}`}
                    d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - geo.radius * 0.06} ${b.x} ${b.y}`}
                    fill="none"
                    stroke={hot ? linkHot : link.emphasis ? linkEmphasis : linkDefault}
                    strokeWidth={hot ? 1.8 : link.emphasis ? 1.3 : 1}
                    strokeDasharray={link.emphasis ? undefined : '3 4'}
                  />
                )
              })}

              {RADAR_NODES.map((item) => {
                const pos = pointAt(geo, item.angle, item.radius)
                const active = item.id === activeId
                const size = sizeOf(item, active)
                return (
                  <g key={`node-${item.id}`} filter={active ? 'url(#radar-glow)' : undefined}>
                    <circle cx={pos.x} cy={pos.y} r={size * 2.4} fill={item.color} opacity={active ? 0.18 : 0.08} />
                    <circle cx={pos.x} cy={pos.y} r={size} fill={item.color} stroke={active ? nodeStrokeActive : nodeStroke} strokeWidth={active ? 2 : 1.2} />
                  </g>
                )
              })}

              {RADAR_NODES.filter((item) => showAllLabels || item.chain || item.id === activeId).map((item) => {
                const row = labelRow.get(item.id) ?? 0
                const anchor = pointAt(geo, item.angle, 1.05 + (row % 2) * 0.062)
                const origin = pointAt(geo, item.angle, item.radius + 0.03)
                const deg = (item.angle * 180) / Math.PI
                const right = deg > -90
                const active = item.id === activeId
                return (
                  <g key={`label-${item.id}`}>
                    <line x1={origin.x} y1={origin.y} x2={anchor.x} y2={anchor.y} stroke={active ? item.color : labelLine} strokeWidth={active ? 1.2 : 0.9} />
                    <text
                      x={anchor.x}
                      y={anchor.y}
                      dx={right ? 5 : -5}
                      dy={3}
                      fill={active ? labelActive : item.chain ? labelChain : labelMuted}
                      fontSize={item.chain ? 10.5 : 9.5}
                      fontWeight={item.chain ? 600 : 400}
                      textAnchor={right ? 'start' : 'end'}
                      transform={`rotate(${right ? deg : deg + 180} ${anchor.x} ${anchor.y})`}
                    >
                      {item.radarLabel}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}

          {tooltip && (
            <div
              className="deduction-radar-tooltip"
              style={{
                left: Math.min(Math.max(tooltip.x + 14, 8), Math.max(width - 246, 8)),
                top: Math.min(Math.max(tooltip.y - 12, 8), geo.height - 112),
              }}
              role="tooltip"
            >
              <strong>{tooltip.node.label}</strong>
              <div><span>潜在影响</span><b>{tooltip.node.impact}</b><em>{tooltip.node.impactScore}</em></div>
              <div><span>建议动作</span><b>{tooltip.node.action}</b><em>{tooltip.node.actionScore}</em></div>
              <div><span>落地时间</span><b>{tooltip.node.horizon}</b><em>{tooltip.node.horizonScore}</em></div>
            </div>
          )}
        </div>

        <aside className="deduction-radar-detail">
          <Tag variant="filled" style={{ background: `${selected.color}14`, color: selected.color, margin: 0 }}>
            {selected.chain ? `推导链 · 第 ${CHAIN_IDS.indexOf(selected.id) + 1} 步` : '关联证据'}
          </Tag>
          <Title level={5}>{selected.label}</Title>
          <Text type="secondary">{selected.detail}</Text>

          <div className="deduction-radar-facts">
            <div>
              <Text type="secondary">潜在影响</Text>
              <ScoreBar value={ratio(selected.impactScore)} color={selected.color} inactiveColor={scoreInactive} />
              <Text>{selected.impact} <Text type="secondary">{selected.impactScore}</Text></Text>
            </div>
            <div>
              <Text type="secondary">建议动作</Text>
              <ScoreBar value={ratio(selected.actionScore)} color="#4f86e8" inactiveColor={scoreInactive} />
              <Text>{selected.action} <Text type="secondary">{selected.actionScore}</Text></Text>
            </div>
            <div>
              <Text type="secondary">落地时间</Text>
              <ScoreBar value={ratio(selected.horizonScore)} color="#8b5cf6" inactiveColor={scoreInactive} />
              <Text>{selected.horizon} <Text type="secondary">{selected.horizonScore}</Text></Text>
            </div>
          </div>

          <div className="deduction-radar-tags">
            {SEGMENTS.map((segment) => (
              <span key={segment.id} className={segment.id === selected.segment ? 'is-active' : ''} style={segment.id === selected.segment ? { borderColor: segment.color, color: segment.color, background: `${segment.color}12` } : undefined}>
                {segment.label}
              </span>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
