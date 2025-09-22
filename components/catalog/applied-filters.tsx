"use client"

import { useCallback, useMemo, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import { buildCatalogQueryString } from '@/lib/catalog-search'
import type {
  CatalogActiveFilters,
  CatalogAlbumOption,
  CatalogColorOption,
  CatalogTagOption,
} from '@/types/catalog'

interface CatalogAppliedFiltersProps {
  active: CatalogActiveFilters & { search?: string }
  albums: CatalogAlbumOption[]
  tags: CatalogTagOption[]
  colors: CatalogColorOption[]
}

export function CatalogAppliedFilters({ active, albums, tags, colors }: CatalogAppliedFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const lookup = useMemo(() => {
    return {
      albumLabel: active.album ? albums.find((album) => album.id === active.album)?.title : undefined,
      tagsLabels: active.tags.map((tagName) => tags.find((tag) => tag.name === tagName)?.name ?? tagName),
      colorsLabels: active.colors.map((value) => colors.find((color) => color.value === value)?.label ?? value),
    }
  }, [active.album, active.tags, active.colors, albums, tags, colors])

  const handleRemove = useCallback((patch: { album?: null; tags?: string[]; colors?: string[]; search?: null }) => {
    const current = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams()
    const query = buildCatalogQueryString(current, {
      album: patch.album,
      tags: patch.tags ?? undefined,
      colors: patch.colors ?? undefined,
      search: patch.search,
    })

    startTransition(() => {
      const target = query ? `${pathname}?${query}` : pathname
      router.replace(target, { scroll: false })
    })
  }, [searchParams, pathname, router, startTransition])

  const chipItems = useMemo(() => {
    const items: Array<{ key: string; label: string; onRemove: () => void }> = []

    if (active.album && lookup.albumLabel) {
      items.push({
        key: `album-${active.album}`,
        label: lookup.albumLabel,
        onRemove: () => handleRemove({ album: null }),
      })
    }

    active.tags.forEach((tagName) => {
      const label = tags.find((tag) => tag.name === tagName)?.name ?? tagName
      items.push({
        key: `tag-${tagName}`,
        label: `#${label}`,
        onRemove: () => handleRemove({ tags: active.tags.filter((value) => value !== tagName) }),
      })
    })

    active.colors.forEach((colorValue) => {
      const label = colors.find((color) => color.value === colorValue)?.label ?? colorValue
      items.push({
        key: `color-${colorValue}`,
        label: `色彩 ${label}`,
        onRemove: () => handleRemove({ colors: active.colors.filter((value) => value !== colorValue) }),
      })
    })

    if (active.search) {
      items.push({
        key: 'search-term',
        label: `搜索 “${active.search}”`,
        onRemove: () => handleRemove({ search: null }),
      })
    }

    return items
  }, [active.album, active.tags, active.colors, active.search, lookup, tags, colors, handleRemove])

  const handleClearAll = useCallback(() => {
    const current = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams()
    const query = buildCatalogQueryString(current, {
      album: null,
      tags: [],
      colors: [],
      search: null,
    })

    startTransition(() => {
      const target = query ? `${pathname}?${query}` : pathname
      router.replace(target, { scroll: false })
    })
  }, [searchParams, pathname, router, startTransition])

  if (chipItems.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Text size="xs" tone="muted">
        已选
      </Text>
      {chipItems.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onRemove}
          className={cn(
            'group flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/20',
          )}
        >
          <span className="truncate max-w-[140px]">{item.label}</span>
          <X className="h-3 w-3" aria-hidden />
        </button>
      ))}
      <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={handleClearAll}>
        清除全部
      </Button>
    </div>
  )
}
