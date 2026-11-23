'use client'

import { useEffect, useRef } from 'react'
import { Graph, type Cell } from '@antv/x6'
import { mindmap as mindmapLayout, type HierarchyNode } from '@antv/hierarchy'
import type { StudioMindmapNode, StudioMindmapPayload } from '@/lib/api/types'

/** Canvas geometry, in graph units. Text wraps to these widths. */
const ROOT_W = 190
const ROOT_H = 48
const BRANCH_W = 168
const BRANCH_H = 42
const LEAF_W = 178
const LEAF_H = 34
const H_GAP = 46
const V_GAP = 14

const FONT = '13px -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif'
const FONT_ROOT = '600 14px -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif'

type Depth = 0 | 1 | 2

type MindNode = {
  id: string
  label: string
  depth: Depth
  width: number
  height: number
  children?: MindNode[]
}

function nodeSize(depth: Depth): { width: number; height: number } {
  if (depth === 0) return { width: ROOT_W, height: ROOT_H }
  if (depth === 1) return { width: BRANCH_W, height: BRANCH_H }
  return { width: LEAF_W, height: LEAF_H }
}

/** Depth-capped flatten of the model tree; the studio payload is only 3 levels deep. */
function toMindNodes(
  node: StudioMindmapNode,
  path: string,
  depth: Depth,
): MindNode {
  const { width, height } = nodeSize(depth)
  const childDepth = (depth >= 2 ? 2 : depth + 1) as Depth
  const children = (node.children ?? []).map((child, index) =>
    toMindNodes(child, `${path}-${index}`, childDepth),
  )
  return {
    id: path,
    label: node.label,
    depth,
    width,
    height,
    children: children.length > 0 ? children : undefined,
  }
}

type HierarchyResult = HierarchyNode & {
  data: MindNode
  x: number
  y: number
  children?: HierarchyResult[]
}

/** Palette keyed by depth so the map stays native to the page's shell tokens. */
function paletteFor(depth: Depth) {
  if (depth === 0) {
    return { fill: '#1677ff', stroke: '#0958d9', color: '#ffffff', font: FONT_ROOT }
  }
  if (depth === 1) {
    return { fill: '#e6f4ff', stroke: '#91caff', color: '#0958d9', font: FONT }
  }
  return { fill: '#ffffff', stroke: '#e5e7eb', color: '#334155', font: FONT }
}

let registered = false

function registerShapes() {
  if (registered) return
  registered = true

  Graph.registerNode(
    'eea-mindmap-topic',
    {
      inherit: 'rect',
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ],
      attrs: {
        body: { rx: 8, ry: 8, refWidth: '100%', refHeight: '100%' },
        label: {
          refX: 0.5,
          refY: 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          textWrap: { width: -22, height: -8, ellipsis: true },
        },
      },
    },
    true,
  )

  // Curved elbow matching the official mindmap example.
  Graph.registerConnector(
    'eea-mindmap',
    (sourcePoint, targetPoint, _routerPoints, options) => {
      const midX = sourcePoint.x + 14
      const ctrX = (targetPoint.x - midX) / 4 + midX
      const pathData = `M ${sourcePoint.x} ${sourcePoint.y} L ${midX} ${sourcePoint.y} Q ${ctrX} ${targetPoint.y} ${targetPoint.x} ${targetPoint.y}`
      return options.raw ? pathData : pathData
    },
    true,
  )
}

export function StudioMindmap({ data }: { data: StudioMindmapPayload }) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    const container = canvasRef.current
    if (!host || !container) return

    registerShapes()

    const root: MindNode = {
      id: 'root',
      label: data.title,
      depth: 0,
      width: ROOT_W,
      height: ROOT_H,
      children: data.children.map((child, index) =>
        toMindNodes(child, `b${index}`, 1),
      ),
    }

    // X6 writes inline width/height from its measured host box. Measure the host
    // (which owns the CSS height) so the canvas is never 2px tall.
    const measure = () => {
      const rect = host.getBoundingClientRect()
      return {
        width: Math.max(Math.round(rect.width), 320),
        height: Math.max(Math.round(rect.height), 320),
      }
    }
    const { width, height } = measure()
    container.style.width = `${width}px`
    container.style.height = `${height}px`

    const graph = new Graph({
      container,
      width,
      height,
      autoResize: false,
      background: { color: 'transparent' },
      grid: { visible: false },
      panning: { enabled: true, eventTypes: ['leftMouseDown', 'mouseWheel'] },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
        minScale: 0.2,
        maxScale: 2.5,
      },
      interacting: { nodeMovable: false, edgeMovable: false },
    })

    const rendered = mindmapLayout(root as never, {
      direction: 'H',
      getHeight: (node) => (node as MindNode).height,
      getWidth: (node) => (node as MindNode).width,
      getHGap: () => H_GAP,
      getVGap: () => V_GAP,
      getSide: () => 'right',
    }) as HierarchyResult

    const cells: Cell[] = []
    const walk = (node: HierarchyResult) => {
      const depth = node.data.depth
      const tone = paletteFor(depth)
      cells.push(
        graph.createNode({
          id: node.id,
          shape: 'eea-mindmap-topic',
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          attrs: {
            body: { fill: tone.fill, stroke: tone.stroke, strokeWidth: depth === 2 ? 1 : 1.5 },
            label: { text: node.data.label, fill: tone.color, font: tone.font },
          },
        }),
      )
      for (const child of node.children ?? []) {
        cells.push(
          graph.createEdge({
            shape: 'edge',
            source: { cell: node.id, anchor: { name: 'right' } },
            target: { cell: child.id, anchor: { name: 'left' } },
            connector: { name: 'eea-mindmap' },
            attrs: {
              line: {
                stroke: child.data.depth === 1 ? '#91caff' : '#dbe3ec',
                strokeWidth: child.data.depth === 1 ? 2 : 1.4,
                targetMarker: null,
              },
            },
            zIndex: -1,
          }),
        )
        walk(child)
      }
    }
    walk(rendered)

    graph.resetCells(cells)
    // Fit the whole tree instead of centring it: a wide mindmap would otherwise
    // start clipped at the pane edges.
    const fit = () => {
      graph.zoomToFit({ padding: 24, maxScale: 1 })
    }
    fit()

    // Keep the drawing fitted when the pane is resized.
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            const next = measure()
            container.style.width = `${next.width}px`
            container.style.height = `${next.height}px`
            graph.resize(next.width, next.height)
            fit()
          })
        : null
    observer?.observe(host)

    return () => {
      observer?.disconnect()
      graph.dispose()
    }
  }, [data])

  return (
    <div ref={hostRef} className="evidence-mindmap-host">
      <div ref={canvasRef} className="evidence-mindmap-canvas" />
    </div>
  )
}