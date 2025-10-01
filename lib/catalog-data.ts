import type { Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import {
  type CatalogAlbumOption,
  type CatalogColorOption,
  type CatalogFacetItem,
  type CatalogFilterOptions,
  type CatalogNormalizedParams,
  type CatalogRecommendationItem,
  type CatalogSortValue,
  type CatalogTagOption,
  type CatalogViewValue,
} from '@/types/catalog'
import type { PhotoWithDetails } from '@/types'
import { buildCatalogQueryString, type CatalogSearchFilter, type CatalogSearchSuggestion } from '@/lib/catalog-search'

export const CATALOG_PATH = '/photos'
export const SORT_VALUES: CatalogSortValue[] = ['newest', 'oldest', 'name']
export const VIEW_VALUES: CatalogViewValue[] = ['masonry', 'grid', 'list']

export const catalogNumberFormatter = new Intl.NumberFormat('zh-CN')

export function normalizeSort(value?: string | null): CatalogSortValue {
  if (value && SORT_VALUES.includes(value as CatalogSortValue)) {
    return value as CatalogSortValue
  }
  return 'newest'
}

export function normalizeView(value?: string | null): CatalogViewValue {
  if (value && VIEW_VALUES.includes(value as CatalogViewValue)) {
    return value as CatalogViewValue
  }
  return 'masonry'
}

export function getStringParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export function getArrayParam(value?: string | string[]): string[] {
  if (!value) return []
  const list = Array.isArray(value) ? value : value.split(',')
  return Array.from(new Set(list.map((item) => item.trim()).filter(Boolean)))
}

function buildCatalogWhere(params: CatalogNormalizedParams): Prisma.PhotoWhereInput {
  const where: Prisma.PhotoWhereInput = {
    visibility: 'PUBLIC',
    status: 'COMPLETED',
  }

  if (params.album) {
    where.albumId = params.album
  }

  if (params.search) {
    const term = params.search.trim()
    if (term) {
      where.OR = [
        {
          album: {
            title: {
              contains: term,
            },
          },
        },
        {
          tags: {
            some: {
              tag: {
                name: {
                  contains: term,
                },
              },
            },
          },
        },
      ]
    }
  }

  const andConditions: Prisma.PhotoWhereInput[] = []

  if (params.tags.length > 0) {
    for (const tagName of params.tags) {
      andConditions.push({
        tags: {
          some: {
            tag: {
              name: {
                equals: tagName,
              },
            },
          },
        },
      })
    }
  }

  if (params.colors.length > 0) {
    andConditions.push({
      tags: {
        some: {
          tag: {
            color: {
              in: params.colors,
            },
          },
        },
      },
    })
  }

  if (andConditions.length > 0) {
    if (Array.isArray(where.AND)) {
      where.AND = [...where.AND, ...andConditions]
    } else if (where.AND) {
      where.AND = [where.AND, ...andConditions]
    } else {
      where.AND = andConditions
    }
  }

  return where
}

function buildOrderBy(sort: CatalogSortValue): Prisma.PhotoOrderByWithRelationInput {
  switch (sort) {
    case 'oldest':
      return { createdAt: 'asc' }
    case 'name':
      return { album: { title: 'asc' } }
    case 'newest':
    default:
      return { createdAt: 'desc' }
  }
}

export async function getCatalogResults(params: CatalogNormalizedParams): Promise<{
  photos: PhotoWithDetails[]
  total: number
}> {
  const where = buildCatalogWhere(params)
  const orderBy = buildOrderBy(params.sort)

  const [photos, total] = await Promise.all([
    db.photo.findMany({
      where,
      include: {
        variants: true,
        tags: { include: { tag: true } },
        album: true,
      },
      orderBy,
      take: 120,
    }),
    db.photo.count({ where }),
  ])

  return { photos, total }
}

export async function getCatalogFilterOptions(): Promise<CatalogFilterOptions> {
  const [albums, tags] = await Promise.all([
    db.album.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            photos: {
              where: {
                visibility: 'PUBLIC',
                status: 'COMPLETED',
              },
            },
          },
        },
      },
      where: {
        photos: {
          some: {
            visibility: 'PUBLIC',
            status: 'COMPLETED',
          },
        },
      },
      orderBy: { title: 'asc' },
    }),
    db.tag.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            photoTags: {
              where: {
                photo: {
                  visibility: 'PUBLIC',
                  status: 'COMPLETED',
                },
              },
            },
          },
        },
      },
      where: {
        photoTags: {
          some: {
            photo: {
              visibility: 'PUBLIC',
              status: 'COMPLETED',
            },
          },
        },
      },
      orderBy: { photoTags: { _count: 'desc' } },
      take: 120,
    }),
  ])

  const albumOptions: CatalogAlbumOption[] = albums.map((album) => ({
    id: album.id,
    title: album.title,
    count: album._count.photos,
  }))

  const tagOptions: CatalogTagOption[] = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    count: tag._count.photoTags,
  }))

  const colorMap = new Map<string, CatalogColorOption>()
  for (const tag of tagOptions) {
    const key = tag.color.toLowerCase()
    const existing = colorMap.get(key)
    if (existing) {
      existing.count += tag.count
    } else {
      colorMap.set(key, {
        value: tag.color,
        label: tag.color.toUpperCase(),
        count: tag.count,
      })
    }
  }

  const colorOptions = Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  return {
    albums: albumOptions,
    tags: tagOptions,
    colors: colorOptions,
  }
}

export function buildCatalogHref(filters: CatalogSearchFilter): string {
  const query = buildCatalogQueryString(new URLSearchParams(), filters)
  return query ? `${CATALOG_PATH}?${query}` : CATALOG_PATH
}

export function buildCatalogStats(total: number, filterOptions: CatalogFilterOptions) {
  return [
    {
      label: '作品总量',
      value: catalogNumberFormatter.format(total),
    },
    {
      label: '可选专辑',
      value: catalogNumberFormatter.format(filterOptions.albums.length),
    },
    {
      label: '热门标签',
      value: catalogNumberFormatter.format(filterOptions.tags.length),
    },
  ]
}

export function buildCatalogQuickLinks(filterOptions: CatalogFilterOptions) {
  const links: Array<{ href: string; label: string; description?: string }> = [
    {
      href: buildCatalogHref({ sort: 'newest' }),
      label: '最新发布',
      description: '第一时间查看刚上线的系列',
    },
  ]

  const topTag = filterOptions.tags[0]
  if (topTag) {
    links.push({
      href: buildCatalogHref({ tags: [topTag.name] }),
      label: `#${topTag.name}`,
      description: `${catalogNumberFormatter.format(topTag.count)} 张相关作品`,
    })
  }

  const topAlbum = filterOptions.albums[0]
  if (topAlbum) {
    links.push({
      href: buildCatalogHref({ album: topAlbum.id }),
      label: topAlbum.title,
      description: `${catalogNumberFormatter.format(topAlbum.count)} 张精选照片`,
    })
  }

  return links
}

export function buildCatalogRecommendations(
  params: CatalogNormalizedParams,
  filterOptions: CatalogFilterOptions,
): CatalogRecommendationItem[] {
  const recommendations: CatalogRecommendationItem[] = []
  const seen = new Set<string>()

  const addRecommendation = (item: CatalogRecommendationItem) => {
    if (seen.has(item.id)) return
    seen.add(item.id)
    recommendations.push(item)
  }

  if (!params.album && filterOptions.albums.length > 0) {
    const album = filterOptions.albums[0]
    addRecommendation({
      id: `rec-album-${album.id}`,
      title: album.title,
      description: `精选 ${catalogNumberFormatter.format(album.count)} 张作品，完整呈现该系列的叙事节奏。`,
      href: buildCatalogHref({ album: album.id }),
      badge: '热门专辑',
      stats: `${catalogNumberFormatter.format(album.count)} 张作品`,
      patch: {
        album: album.id,
        tags: [],
        colors: [],
        search: null,
      },
    })
  }

  const tagCandidates = filterOptions.tags
    .filter((tag) => !params.tags.includes(tag.name))
    .slice(0, 3)

  for (const tag of tagCandidates) {
    addRecommendation({
      id: `rec-tag-${tag.id}`,
      title: `#${tag.name}`,
      description: `探索 ${tag.name} 主题的焦点瞬间。`,
      href: buildCatalogHref({ tags: [tag.name] }),
      badge: '标签推荐',
      stats: `${catalogNumberFormatter.format(tag.count)} 张作品`,
      accentColor: tag.color,
      patch: {
        tags: [tag.name],
        album: null,
        colors: [],
        search: null,
      },
    })
  }

  const colorCandidates = filterOptions.colors
    .filter((color) => !params.colors.includes(color.value))
    .slice(0, 2)

  for (const color of colorCandidates) {
    addRecommendation({
      id: `rec-color-${color.value}`,
      title: `色彩 ${color.label}`,
      description: `沉浸在 ${color.label} 色调下的视觉故事。`,
      href: buildCatalogHref({ colors: [color.value] }),
      badge: '色彩分面',
      stats: `${catalogNumberFormatter.format(color.count)} 张作品`,
      accentColor: color.value,
      patch: {
        colors: [color.value],
        album: null,
        tags: [],
        search: null,
      },
    })
  }

  return recommendations.slice(0, 4)
}

export function buildCatalogFacetSections(
  params: CatalogNormalizedParams,
  filterOptions: CatalogFilterOptions,
  photos: PhotoWithDetails[],
): CatalogFacetItem[] {
  const facets: CatalogFacetItem[] = []
  const seen = new Set<string>()

  const addFacet = (facet: CatalogFacetItem) => {
    if (facet.photos.length < 3) return
    if (seen.has(facet.id)) return
    seen.add(facet.id)
    facets.push(facet)
  }

  for (const tag of filterOptions.tags) {
    if (facets.length >= 3) break
    if (params.tags.includes(tag.name)) continue

    const taggedPhotos = photos
      .filter((photo) => photo.tags.some((entry) => entry.tag.name === tag.name))
      .slice(0, 6)

    addFacet({
      id: `facet-tag-${tag.id}`,
      title: `#${tag.name}`,
      subtitle: `${catalogNumberFormatter.format(tag.count)} 张作品`,
      href: buildCatalogHref({ tags: [tag.name] }),
      accentColor: tag.color,
      photos: taggedPhotos,
    })
  }

  for (const color of filterOptions.colors) {
    if (facets.length >= 4) break
    if (params.colors.includes(color.value)) continue

    const colorPhotos = photos
      .filter((photo) =>
        photo.tags.some((entry) => entry.tag.color.toLowerCase() === color.value.toLowerCase()),
      )
      .slice(0, 6)

    addFacet({
      id: `facet-color-${color.value}`,
      title: `色彩 ${color.label}`,
      subtitle: `${catalogNumberFormatter.format(color.count)} 张对应色调`,
      href: buildCatalogHref({ colors: [color.value] }),
      accentColor: color.value,
      photos: colorPhotos,
    })
  }

  if (!params.album && filterOptions.albums.length > 0 && facets.length < 4) {
    const album = filterOptions.albums[0]
    const albumPhotos = photos.filter((photo) => photo.album?.id === album.id).slice(0, 6)

    addFacet({
      id: `facet-album-${album.id}`,
      title: album.title,
      subtitle: `${catalogNumberFormatter.format(album.count)} 张作品`,
      href: buildCatalogHref({ album: album.id }),
      photos: albumPhotos,
    })
  }

  return facets.slice(0, 4)
}

export function buildCatalogSearchSuggestions(
  params: CatalogNormalizedParams,
  filterOptions: CatalogFilterOptions,
): CatalogSearchSuggestion[] {
  const suggestions: CatalogSearchSuggestion[] = []

  if (params.search) {
    suggestions.push({
      id: `keyword-${params.search}`,
      label: `搜索“${params.search}”`,
      description: '按 Enter 执行精确搜索',
      type: 'keyword',
      filters: { search: params.search },
      keywords: [params.search],
    })
  }

  filterOptions.tags.slice(0, 8).forEach((tag) => {
    suggestions.push({
      id: `tag-${tag.id}`,
      label: `#${tag.name}`,
      description: `${catalogNumberFormatter.format(tag.count)} 张相关作品`,
      type: 'tag',
      filters: { tags: [tag.name], search: '' },
      keywords: [tag.name],
    })
  })

  filterOptions.albums.slice(0, 6).forEach((album) => {
    suggestions.push({
      id: `album-${album.id}`,
      label: album.title,
      description: `${catalogNumberFormatter.format(album.count)} 张精选照片`,
      type: 'album',
      filters: { album: album.id, search: '' },
      keywords: [album.title],
    })
  })

  filterOptions.colors.slice(0, 6).forEach((color) => {
    suggestions.push({
      id: `color-${color.value}`,
      label: `色彩 ${color.label}`,
      description: `${catalogNumberFormatter.format(color.count)} 张对应色调`,
      type: 'color',
      filters: { colors: [color.value], search: '' },
      keywords: [color.label, color.value],
    })
  })

  return suggestions
}
