"use client"

import { useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Filter, X } from 'lucide-react'

import { CatalogFilterSheet } from '@/components/catalog/filter-sheet'
import { Button } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import { buildCatalogQueryString } from '@/lib/catalog-search'
import type {
  CatalogActiveFilters,
  CatalogAlbumOption,
  CatalogColorOption,
  CatalogFilterPatch,
  CatalogSortValue,
  CatalogTagOption,
} from '@/types/catalog'

import { useOptionalCatalogEventBus } from './catalog-event-bus'

const SORT_OPTIONS: Array<{ value: CatalogSortValue; label: string }> = [
  { value: 'newest', label: '最新优先' },
  { value: 'oldest', label: '最早优先' },
  { value: 'name', label: '按专辑名称' },
]

interface CatalogFilterPanelProps {
  albums: CatalogAlbumOption[]
  tags: CatalogTagOption[]
  colors: CatalogColorOption[]
  active: CatalogActiveFilters & { sort: CatalogSortValue }
}

export function CatalogFilterPanel({ albums, tags, colors, active }: CatalogFilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const eventBus = useOptionalCatalogEventBus()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)

  const activeCount = useMemo(() => {
    let count = 0
    if (active.album) count += 1
    count += active.tags.length
    count += active.colors.length
    return count
  }, [active.album, active.tags.length, active.colors.length])

  const emitFilters = (patch: CatalogFilterPatch) => {
    eventBus?.emit('filters:update', { patch, timestamp: Date.now() })
  }

  const applyFilters = (patch: CatalogFilterPatch) => {
    const current = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams()
    const query = buildCatalogQueryString(current, patch)

    emitFilters(patch)

    startTransition(() => {
      const target = query ? `${pathname}?${query}` : pathname
      router.replace(target, { scroll: false })
    })
  }

  const handleAlbumToggle = (albumId?: string) => {
    if (!albumId || albumId === active.album) {
      applyFilters({ album: null })
    } else {
      applyFilters({ album: albumId })
    }
  }

  const handleTagToggle = (tagName: string) => {
    const isActive = active.tags.includes(tagName)
    const next = isActive
      ? active.tags.filter((value) => value !== tagName)
      : [...active.tags, tagName]
    applyFilters({ tags: next })
  }

  const handleColorToggle = (colorValue: string) => {
    const isActive = active.colors.includes(colorValue)
    const next = isActive
      ? active.colors.filter((value) => value !== colorValue)
      : [...active.colors, colorValue]
    applyFilters({ colors: next })
  }

  const handleSortChange = (value: CatalogSortValue) => {
    if (value === active.sort) return
    applyFilters({ sort: value })
  }

  const handleClearAll = () => {
    applyFilters({ album: null, tags: [], colors: [] })
  }

  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => b.count - a.count)
  }, [tags])

  const displayedTags = showAllTags ? sortedTags : sortedTags.slice(0, 12)

  const renderHeader = () => (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
        <Filter className="h-4 w-4 text-primary" />
        筛选
      </div>
      {activeCount > 0 ? (
        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={handleClearAll}>
          清除全部
        </Button>
      ) : null}
    </div>
  )

  const renderSections = () => (
    <div className="space-y-6">
      <section className="space-y-3">
        <Text size="xs" tone="muted" weight="medium">
          排序
        </Text>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => {
            const isActive = option.value === active.sort
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSortChange(option.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  isActive
                    ? 'border-primary/60 bg-primary/10 text-primary shadow-soft'
                    : 'border-surface-outline/60 text-text-secondary hover:border-primary/40 hover:text-text-primary',
                )}
                aria-pressed={isActive}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <Text size="xs" tone="muted" weight="medium">
          专辑
        </Text>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleAlbumToggle(undefined)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition',
              !active.album
                ? 'border-primary/60 bg-primary/10 text-primary shadow-soft'
                : 'border-surface-outline/60 text-text-secondary hover:border-primary/40 hover:text-text-primary',
            )}
            aria-pressed={!active.album}
          >
            <span>全部作品</span>
            <X className="h-3 w-3 opacity-0" aria-hidden />
          </button>
          {albums.map((album) => {
            const isActive = active.album === album.id
            return (
              <button
                key={album.id}
                type="button"
                onClick={() => handleAlbumToggle(album.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition',
                  isActive
                    ? 'border-primary/60 bg-primary/10 text-primary shadow-soft'
                    : 'border-surface-outline/60 text-text-secondary hover:border-primary/40 hover:text-text-primary',
                )}
                aria-pressed={isActive}
              >
                <span className="truncate">{album.title}</span>
                <span className="text-xs text-text-muted">{album.count}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Text size="xs" tone="muted" weight="medium">
            标签
          </Text>
          {sortedTags.length > 12 ? (
            <button
              type="button"
              onClick={() => setShowAllTags((prev) => !prev)}
              className="text-xs text-primary hover:underline"
            >
              {showAllTags ? '收起' : '展开更多'}
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {displayedTags.map((tag) => {
            const isActive = active.tags.includes(tag.name)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.name)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition',
                  isActive
                    ? 'border-primary/60 bg-primary/10 text-primary shadow-soft'
                    : 'border-surface-outline/60 text-text-secondary hover:border-primary/40 hover:text-text-primary',
                )}
                style={{ boxShadow: isActive ? `0 0 0 1px ${tag.color}33` : undefined }}
                aria-pressed={isActive}
              >
                #{tag.name}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <Text size="xs" tone="muted" weight="medium">
          色彩
        </Text>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => {
            const isActive = active.colors.includes(color.value)
            return (
              <button
                key={color.value}
                type="button"
                onClick={() => handleColorToggle(color.value)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition',
                  isActive
                    ? 'border-primary/60 bg-primary/10 text-primary shadow-soft'
                    : 'border-surface-outline/60 text-text-secondary hover:border-primary/40 hover:text-text-primary',
                )}
                aria-pressed={isActive}
              >
                <span
                  className="h-4 w-4 rounded-full border border-contrast-outline/60 shadow-soft"
                  style={{ backgroundColor: color.value }}
                  aria-hidden
                />
                <span>{color.label}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )

  const closeSheet = () => {
    setSheetOpen(false)
    setShowAllTags(false)
  }

  const renderFilterContent = (variant: 'desktop' | 'sheet') => {
    const sections = renderSections()

    if (variant === 'desktop') {
      return (
        <Surface tone="panel" padding="lg" className="space-y-6 shadow-subtle">
          {renderHeader()}
          {sections}
        </Surface>
      )
    }

    return (
      <div className="flex flex-col gap-6">
        {renderHeader()}
        <div className="max-h-[52vh] overflow-y-auto pr-1">
          {sections}
        </div>
        <Button type="button" variant="default" className="w-full" onClick={closeSheet}>
          完成筛选
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setSheetOpen(true)}
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            筛选{activeCount > 0 ? ` · ${activeCount}` : ''}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>

        <CatalogFilterSheet open={sheetOpen} onClose={closeSheet}>
          {renderFilterContent('sheet')}
        </CatalogFilterSheet>
      </div>

      <div className="hidden lg:block">
        {renderFilterContent('desktop')}
      </div>
    </div>
  )
}
