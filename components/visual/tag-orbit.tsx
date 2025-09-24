"use client"

import { useMemo, useRef, useState } from 'react'
import type { FocusEvent as ReactFocusEvent, MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'

import { useOptionalCatalogEventBus } from '@/components/catalog/catalog-event-bus'
import type { TagGraphEdge, TagGraphPositionedNode } from '@/types/tag-graph'
import { cn } from '@/lib/utils'
import { TagOrbitTooltip } from './tag-orbit-tooltip'

type OrbitMouseEvent = ReactMouseEvent<HTMLButtonElement>
type OrbitFocusEvent = ReactFocusEvent<HTMLButtonElement>

interface TagOrbitProps {
  nodes: TagGraphPositionedNode[]
  edges: TagGraphEdge[]
  className?: string
}

interface NormalizedNode extends TagGraphPositionedNode {
  left: number
  top: number
}

export function TagOrbit({ nodes, edges, className }: TagOrbitProps) {
  const router = useRouter()
  const catalogBus = useOptionalCatalogEventBus()
  const containerRef = useRef<HTMLDivElement | null>(null)

  const normalizedNodes = useMemo<NormalizedNode[]>(() => normalizeNodes(nodes), [nodes])
  const nodeMap = useMemo(() => new Map(normalizedNodes.map((node) => [node.id, node])), [normalizedNodes])

  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const activeNode = activeNodeId ? nodeMap.get(activeNodeId) ?? null : null

  const handleNodeEnter = (nodeId: string, event: OrbitMouseEvent | OrbitFocusEvent) => {
    setActiveNodeId(nodeId)
    updateTooltipPosition(event)
  }

  const handleNodeMove = (event: OrbitMouseEvent) => {
    if (!activeNodeId) return
    updateTooltipPosition(event)
  }

  const handleNodeLeave = () => {
    setActiveNodeId(null)
  }

  const handleNodeSelect = (node: TagGraphPositionedNode) => {
    catalogBus?.emit('filters:update', {
      patch: { tags: [node.id] },
      timestamp: Date.now(),
    })

    const params = new URLSearchParams()
    params.append('tags', node.id)
    router.push(`/photos?${params.toString()}`)
  }

  return (
    <div ref={containerRef} className={cn('relative isolate min-h-[520px] w-full overflow-hidden rounded-[40px] border border-contrast-outline/10 bg-contrast-surface/20 p-6 sm:p-10', className)}>
      <BackgroundGlimmer />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {edges.map((edge) => {
          const source = nodeMap.get(edge.source)
          const target = nodeMap.get(edge.target)
          if (!source || !target) return null
          const strokeWidth = Math.max(0.6, edge.weight * 1.8)
          const opacity = 0.35 + edge.weight * 0.45
          return (
            <line
              key={edge.id}
              x1={source.left}
              y1={source.top}
              x2={target.left}
              y2={target.top}
              stroke="url(#tag-orbit-line)"
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          )
        })}
        <defs>
          <linearGradient id="tag-orbit-line" gradientTransform="rotate(45)">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>
        </defs>
      </svg>

      {normalizedNodes.map((node) => {
        const size = Math.max(48, node.radius)
        return (
          <button
            key={node.id}
            type="button"
            className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-contrast-outline/15 bg-surface-panel/10 p-3 text-text-inverted shadow-surface backdrop-blur-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{ left: `${node.left}%`, top: `${node.top}%`, width: size, height: size }}
            onMouseEnter={(event) => handleNodeEnter(node.id, event)}
            onFocus={(event) => handleNodeEnter(node.id, event)}
            onMouseMove={handleNodeMove}
            onMouseLeave={handleNodeLeave}
            onBlur={handleNodeLeave}
            onClick={() => handleNodeSelect(node)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleNodeSelect(node)
              }
            }}
          >
            <span
              className="pointer-events-none block h-full w-full rounded-full border border-contrast-outline/20 bg-contrast-surface/40 text-xs font-semibold uppercase tracking-[0.3em] text-text-inverted/80 transition group-hover:scale-105"
              style={node.color ? { borderColor: node.color, color: node.color } : undefined}
            >
              <span className="flex h-full w-full items-center justify-center px-3 text-center leading-tight">
                {node.name}
              </span>
            </span>
          </button>
        )
      })}

      <TagOrbitTooltip node={activeNode ?? null} visible={Boolean(activeNode)} position={tooltipPosition} />
    </div>
  )

  function updateTooltipPosition(event: OrbitMouseEvent | OrbitFocusEvent) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientEvent = 'clientX' in event ? event : null
    const x = clientEvent ? clientEvent.clientX + 18 : rect.left + rect.width / 2
    const y = clientEvent ? clientEvent.clientY : rect.top + rect.height / 2
    setTooltipPosition({ x, y })
  }
}

function normalizeNodes(nodes: TagGraphPositionedNode[]): NormalizedNode[] {
  if (nodes.length === 0) return []
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  nodes.forEach((node) => {
    if (node.x < minX) minX = node.x
    if (node.x > maxX) maxX = node.x
    if (node.y < minY) minY = node.y
    if (node.y > maxY) maxY = node.y
  })

  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  const padding = 8 // percent

  return nodes.map((node) => {
    const normalizedX = (node.x - minX) / rangeX
    const normalizedY = (node.y - minY) / rangeY
    const left = padding + normalizedX * (100 - padding * 2)
    const top = padding + normalizedY * (100 - padding * 2)
    return {
      ...node,
      left,
      top,
    }
  })
}

function BackgroundGlimmer() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,97,255,0.18),rgba(9,12,28,0.95))]" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent blur-3xl" aria-hidden="true" />
    </div>
  )
}
