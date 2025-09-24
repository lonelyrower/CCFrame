import Image from 'next/image'

import type { TagGraphNode } from '@/types/tag-graph'
import { cn } from '@/lib/utils'

interface TagOrbitTooltipProps {
  node: TagGraphNode | null
  visible: boolean
  position: { x: number; y: number }
}

export function TagOrbitTooltip({ node, visible, position }: TagOrbitTooltipProps) {
  if (!node || !visible) return null

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-50 w-[260px] max-w-[70vw] translate-x-6 -translate-y-1/2 rounded-3xl border border-contrast-outline/5 bg-contrast-surface/80 p-4 text-text-inverted shadow-floating backdrop-blur-xl transition-opacity duration-150',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.35em] text-text-inverted/50">{node.group ?? '标签'}</p>
          <p className="truncate text-lg font-semibold">{node.name}</p>
        </div>
        <span
          className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-text-inverted/70"
          style={node.color ? { borderColor: node.color, color: node.color } : undefined}
        >
          {node.frequency}
        </span>
      </div>
      {node.featuredPhoto ? (
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-contrast-outline/10">
          <Image
            src={node.featuredPhoto.src}
            alt={node.featuredPhoto.alt ?? node.name}
            width={node.featuredPhoto.width ?? 320}
            height={node.featuredPhoto.height ?? 200}
            className="h-full w-full object-cover"
            sizes="240px"
          />
        </div>
      ) : null}
      <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-text-inverted/50">
        <span>关联 {node.relatedCount ?? 0}</span>
        <span>{formatRole(node.role)}</span>
      </div>
    </div>
  )
}

function formatRole(role: TagGraphNode['role']) {
  switch (role) {
    case 'primary':
      return '核心标签'
    case 'secondary':
      return '延展标签'
    default:
      return '辅助标签'
  }
}
