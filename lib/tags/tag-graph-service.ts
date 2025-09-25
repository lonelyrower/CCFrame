import { cache } from 'react'

import type { TagGraphFilter, TagGraphLayout, TagGraphPositionedNode, TagGraphSnapshot, TagGraphViewModel } from '@/types/tag-graph'
import { demoTagGraphSnapshot } from './demo-data'

const BASE_RADIUS = 320
const MIN_NODE_RADIUS = 28
const MAX_NODE_RADIUS = 96

const getTagGraphSnapshot = cache(async (): Promise<TagGraphSnapshot> => {
  // TODO: Replace with Prisma-backed snapshot fetch when tag_graph_snapshot 表落地
  return demoTagGraphSnapshot
})

export async function getTagUniverse(layout: TagGraphLayout = 'radial', filter: TagGraphFilter = {}): Promise<TagGraphViewModel> {
  const snapshot = await getTagGraphSnapshot()
  const filteredSnapshot = applyFilter(snapshot, filter)
  const nodes = layout === 'force' ? computeForceLayout(filteredSnapshot) : computeRadialLayout(filteredSnapshot)

  return {
    layout,
    nodes,
    edges: filteredSnapshot.edges,
    stats: filteredSnapshot.stats,
    generatedAt: filteredSnapshot.generatedAt,
    version: filteredSnapshot.version,
  }
}

function applyFilter(snapshot: TagGraphSnapshot, filter: TagGraphFilter): TagGraphSnapshot {
  if (!filter.focusTagId && !filter.minimumWeight && !filter.role) {
    return snapshot
  }

  const nodeAllowList = new Set<string>()
  const edgeAllowList = new Set(snapshot.edges.map((edge) => edge.id))

  if (filter.focusTagId) {
    nodeAllowList.add(filter.focusTagId)
    snapshot.edges.forEach((edge) => {
      if (edge.source === filter.focusTagId || edge.target === filter.focusTagId) {
        nodeAllowList.add(edge.source)
        nodeAllowList.add(edge.target)
      }
    })
  }

  const roleFilter = filter.role
  const minWeight = filter.minimumWeight ?? 0

  const nodes = snapshot.nodes.filter((node) => {
    const roleOk = roleFilter ? node.role === roleFilter : true
    const focusOk = nodeAllowList.size > 0 ? nodeAllowList.has(node.id) : true
    return roleOk && focusOk
  })

  const nodeSet = new Set(nodes.map((node) => node.id))

  const edges = snapshot.edges.filter((edge) => {
    if (edge.weight < minWeight) return false
    if (!nodeSet.has(edge.source) || !nodeSet.has(edge.target)) return false
    if (edgeAllowList.size > 0 && !edgeAllowList.has(edge.id) && filter.focusTagId) return false
    return true
  })

  const stats = {
    ...snapshot.stats,
    totalTags: nodes.length,
    totalEdges: edges.length,
  }

  return {
    ...snapshot,
    nodes,
    edges,
    stats,
  }
}

function computeRadialLayout(snapshot: TagGraphSnapshot): TagGraphPositionedNode[] {
  const sorted = [...snapshot.nodes].sort((a, b) => b.frequency - a.frequency)
  const maxFrequency = snapshot.stats.maxFrequency || 1
  const angularStep = (Math.PI * 2) / Math.max(sorted.length, 1)

  return sorted.map((node, index) => {
    const strength = node.frequency / maxFrequency
    const radius = MIN_NODE_RADIUS + (MAX_NODE_RADIUS - MIN_NODE_RADIUS) * strength
    const orbit = BASE_RADIUS * (node.role === 'primary' ? 0.72 : node.role === 'secondary' ? 0.86 : 1.02)
    const angle = angularStep * index
    const x = Math.cos(angle) * orbit
    const y = Math.sin(angle) * orbit

    return {
      ...node,
      radius,
      x,
      y,
    }
  })
}

function computeForceLayout(snapshot: TagGraphSnapshot): TagGraphPositionedNode[] {
  // 简化版：在 radial 基础上增加少量扰动，后续可接入 Web Worker + d3-force
  const radial = computeRadialLayout(snapshot)
  return radial.map((node, index) => {
    const jitter = pseudoRandom(index, node.id)
    return {
      ...node,
      x: node.x + jitter.x,
      y: node.y + jitter.y,
    }
  })
}

function pseudoRandom(index: number, seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const normalized = Math.sin(index + hash) * 43758.5453
  const delta = (normalized - Math.floor(normalized)) - 0.5
  const magnitude = 24 + (Math.abs(hash % 17) / 17) * 18
  return {
    x: delta * magnitude,
    y: ((delta * 1.618) % 1) * magnitude,
  }
}

// Functions needed for the enhanced Tags page
export async function getTagGraphQuery(filter: TagGraphFilter = {}) {
  const snapshot = await getTagGraphSnapshot()
  const filteredSnapshot = applyFilter(snapshot, filter)
  const nodes = computeRadialLayout(filteredSnapshot)

  return {
    layout: 'radial' as const,
    nodes,
    edges: filteredSnapshot.edges,
    stats: filteredSnapshot.stats,
    filter,
    generatedAt: filteredSnapshot.generatedAt,
    version: filteredSnapshot.version,
  }
}

export function parseTagGraphFilters(searchParams: Record<string, string | string[] | undefined> = {}): TagGraphFilter {
  const focusTagId = typeof searchParams.focus === 'string' ? searchParams.focus : undefined
  const minimumWeight = typeof searchParams.minWeight === 'string' ? parseFloat(searchParams.minWeight) : undefined
  const role = typeof searchParams.role === 'string' && ['primary', 'secondary', 'supporting'].includes(searchParams.role)
    ? searchParams.role as 'primary' | 'secondary' | 'supporting'
    : undefined

  return {
    focusTagId,
    minimumWeight,
    role,
  }
}
