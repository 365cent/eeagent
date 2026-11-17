'use client'

import { useMemo } from 'react'

export type StageTag = {
  tag: string
  support: number
}

export type StageCluster = {
  key: string
  label: string
  tags: string[]
}

type ChipPosition = {
  tag: string
  x: number
  y: number
  delay: number
  clusterKey: string | null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hashUnit(text: string) {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return (hash % 1000) / 1000
}

function scatter(tag: string, index: number, total: number) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2
  const radius = 26 + hashUnit(tag) * 14
  return {
    x: clamp(50 + Math.cos(angle) * radius * 0.9, 8, 92),
    y: clamp(48 + Math.sin(angle) * radius * 0.62, 16, 82),
  }
}

function gathered(tag: string, clusterIndex: number, clusterCount: number, tagIndex: number, tagCount: number) {
  const column = ((clusterIndex + 1) / (clusterCount + 1)) * 100
  const angle = (tagIndex / Math.max(tagCount, 1)) * Math.PI * 2 + hashUnit(tag)
  const radius = tagCount > 5 ? 11 : 8
  return {
    x: clamp(column + Math.cos(angle) * radius, 10, 90),
    y: clamp(42 + Math.sin(angle) * radius * 0.9, 18, 70),
  }
}

export type ClusterStagePhase = 'scatter' | 'gather' | 'formed'

export function TopicClusterStage({
  tags,
  clusters,
  phase,
  formingKey,
  activeKey,
}: {
  tags: StageTag[]
  clusters: StageCluster[]
  phase: ClusterStagePhase
  formingKey?: string | null
  activeKey?: string | null
}) {
  const gatheredPhase = phase !== 'scatter'
  const chips = useMemo((): ChipPosition[] => {
    const visibleTags = tags.slice(0, 18)
    const homes = new Map<string, { clusterKey: string; clusterIndex: number; tagIndex: number; tagCount: number }>()
    clusters.forEach((cluster, clusterIndex) => {
      const owned = visibleTags.filter((item) => cluster.tags.includes(item.tag))
      owned.forEach((item, tagIndex) => {
        const current = homes.get(item.tag)
        if (!current || clusterIndex < current.clusterIndex) {
          homes.set(item.tag, {
            clusterKey: cluster.key,
            clusterIndex,
            tagIndex,
            tagCount: Math.max(owned.length, 1),
          })
        }
      })
    })
    return visibleTags.map((item, index) => {
      const home = gatheredPhase ? homes.get(item.tag) : undefined
      const point = home
        ? gathered(item.tag, home.clusterIndex, Math.max(clusters.length, 1), home.tagIndex, home.tagCount)
        : scatter(item.tag, index, visibleTags.length)
      return {
        tag: item.tag,
        x: point.x,
        y: point.y,
        delay: gatheredPhase ? index * 36 : 0,
        clusterKey: home?.clusterKey ?? null,
      }
    })
  }, [clusters, gatheredPhase, tags])

  const visibleClusters = clusters.slice(0, 4)
  const captions = gatheredPhase
    ? visibleClusters.map((cluster, index) => ({
        key: cluster.key,
        label: cluster.label,
        x: ((index + 1) / (visibleClusters.length + 1)) * 100,
      }))
    : []

  const stageClass = [
    'topic-forge-stage',
    phase === 'gather' ? 'is-gathering' : '',
    phase === 'formed' ? 'is-formed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={stageClass} aria-hidden={tags.length === 0}>
      <div className="topic-forge-core" />
      {captions.map((caption) => (
        <span
          key={`${caption.key}-well`}
          className="topic-forge-well"
          style={{ left: `${caption.x}%` }}
        />
      ))}
      {chips.map((chip) => {
        const gathering = formingKey != null && chip.clusterKey === formingKey
        const active = activeKey != null && chip.clusterKey === activeKey
        const className = [
          'topic-orbit-chip',
          gatheredPhase ? 'is-settled' : 'is-drifting',
          chip.clusterKey ? 'is-grouped' : '',
          gathering ? 'is-gathering' : '',
          active ? 'is-active' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <span
            key={chip.tag}
            className={className}
            style={{ left: `${chip.x}%`, top: `${chip.y}%`, transitionDelay: `${chip.delay}ms` }}
          >
            {chip.tag}
          </span>
        )
      })}
      {captions.map((caption) => (
        <span key={caption.key} className="topic-forge-caption" style={{ left: `${caption.x}%` }}>
          {caption.label}
        </span>
      ))}
    </div>
  )
}
