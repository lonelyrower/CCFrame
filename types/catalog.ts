import type { PhotoWithDetails } from './index'

export type CatalogSortValue = 'newest' | 'oldest' | 'name'
export type CatalogViewValue = 'masonry' | 'grid' | 'list'

export interface CatalogAlbumOption {
  id: string
  title: string
  count: number
}

export interface CatalogTagOption {
  id: string
  name: string
  color: string
  count: number
}

export interface CatalogColorOption {
  value: string
  label: string
  count: number
}

export interface CatalogFavoriteSnapshot {
  id: string
  title?: string | null
  albumTitle?: string | null
  primaryTag?: string | null
}

export interface CatalogRecommendationItem {
  id: string
  title: string
  description: string
  href: string
  badge?: string
  stats?: string
  accentColor?: string
  patch?: CatalogFilterPatch
}

export interface CatalogFacetItem {
  id: string
  title: string
  subtitle?: string
  href: string
  accentColor?: string
  photos: PhotoWithDetails[]
}

export interface CatalogFilterOptions {
  albums: CatalogAlbumOption[]
  tags: CatalogTagOption[]
  colors: CatalogColorOption[]
}

export interface CatalogActiveFilters {
  album?: string
  tags: string[]
  colors: string[]
}

export interface CatalogNormalizedParams extends CatalogActiveFilters {
  sort: CatalogSortValue
  view: CatalogViewValue
  search?: string
}

export interface CatalogFilterPatch {
  album?: string | null
  tags?: string[]
  colors?: string[]
  sort?: CatalogSortValue
  search?: string | null
}
