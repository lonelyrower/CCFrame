export type TagGraphLayout = 'force' | 'radial'

export interface TagGraphPhoto {
  id: string
  src: string
  alt?: string | null
  width?: number | null
  height?: number | null
}

export type TagNodeRole = 'primary' | 'secondary' | 'supporting'

export interface TagGraphNode {
  id: string
  name: string
  color?: string | null
  radius: number
  frequency: number
  group?: string | null
  role: TagNodeRole
  featuredPhoto?: TagGraphPhoto | null
  relatedCount?: number | null
}

export interface TagGraphEdge {
  id: string
  source: string
  target: string
  weight: number
  strength?: number | null
}

export interface TagGraphPositionedNode extends TagGraphNode {
  x: number
  y: number
  z?: number
}

export interface TagGraphSnapshot {
  id: string
  layout: TagGraphLayout
  nodes: TagGraphNode[]
  edges: TagGraphEdge[]
  stats: {
    totalTags: number
    totalEdges: number
    maxFrequency: number
  }
  generatedAt: string
  version: string
}

export interface TagGraphViewModel {
  layout: TagGraphLayout
  nodes: TagGraphPositionedNode[]
  edges: TagGraphEdge[]
  stats: TagGraphSnapshot['stats']
  generatedAt: string
  version: string
}

export interface TagGraphFilter {
  focusTagId?: string
  minimumWeight?: number
  role?: TagNodeRole
}

export interface TagGraphQueryResult extends TagGraphViewModel {
  filter: TagGraphFilter
}
