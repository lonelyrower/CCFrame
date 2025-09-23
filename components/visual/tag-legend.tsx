import type { TagGraphNode } from '@/types/tag-graph'

interface TagLegendProps {
  nodes: TagGraphNode[]
}

export function TagLegend({ nodes }: TagLegendProps) {
  const clusters = groupByCluster(nodes)

  return (
    <section className="rounded-[32px] border border-white/10 bg-black/30 p-6 text-white backdrop-blur-lg">
      <p className="text-xs uppercase tracking-[0.35em] text-white/50">标签簇</p>
      <ul className="mt-4 space-y-3">
        {clusters.map((cluster) => (
          <li key={cluster.name} className="flex items-center justify-between gap-4 text-sm text-white/70">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cluster.color ?? '#6EA3FF' }} aria-hidden="true" />
              <span>{cluster.name}</span>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">{cluster.count}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function groupByCluster(nodes: TagGraphNode[]) {
  const map = new Map<string, { name: string; color?: string | null; count: number }>()
  nodes.forEach((node) => {
    const key = node.group ?? '未分组'
    const entry = map.get(key)
    if (entry) {
      entry.count += 1
    } else {
      map.set(key, { name: key, color: node.color, count: 1 })
    }
  })
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}
