"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'

interface AlbumOption {
  id: string
  title: string
  count: number
}

interface TagOption {
  id: string
  name: string
  count: number
}

interface FilterParams {
  view?: string
  sort?: string
  album?: string
  tag?: string
  search?: string
}

interface PhotosFiltersProps {
  albums: AlbumOption[]
  tags: TagOption[]
  params: FilterParams
  className?: string
  variant?: 'panel' | 'plain'
}

export function PhotosFilters({ albums, tags, params, className, variant = 'panel' }: PhotosFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(params.search ?? '')
  const [, startTransition] = useTransition()

  const baseParams = useMemo(() => {
    return new URLSearchParams(searchParams ? searchParams.toString() : '')
  }, [searchParams])

  useEffect(() => {
    setSearchValue(params.search ?? '')
  }, [params.search])

  const applyParams = (updater: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(baseParams.toString())
    updater(next)
    startTransition(() => {
      const query = next.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  const handleSelectChange = (key: 'sort' | 'album' | 'tag') => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    applyParams((next) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = searchValue.trim()
    applyParams((next) => {
      if (value) next.set('search', value)
      else next.delete('search')
    })
  }

  const wrapperClassName = cn(
    variant === 'panel'
      ? 'rounded-xl border border-surface-outline/40 bg-surface-panel/80 p-6 shadow-subtle backdrop-blur-sm'
      : '',
    className,
  )

  return (
    <div className={wrapperClassName}>
      <form className="flex flex-wrap gap-4" onSubmit={handleSearchSubmit}>
        <div className="flex-1 min-w-60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              name="search"
              placeholder="Search albums or tags"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="w-full rounded-lg border border-surface-outline/60 bg-surface-canvas/80 py-2 pl-10 pr-4 text-sm text-text-primary shadow-subtle transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-surface-panel/80"
            />
          </div>
        </div>

        <select
          name="sort"
          value={params.sort || 'newest'}
          onChange={handleSelectChange('sort')}
          className="min-w-36 rounded-lg border border-surface-outline/60 bg-surface-canvas/80 px-3 py-2 text-sm text-text-primary shadow-subtle focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-surface-panel/80"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Album name</option>
        </select>

        <select
          name="album"
          value={params.album || ''}
          onChange={handleSelectChange('album')}
          className="min-w-36 rounded-lg border border-surface-outline/60 bg-surface-canvas/80 px-3 py-2 text-sm text-text-primary shadow-subtle focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-surface-panel/80"
        >
          <option value="">All albums</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title} ({album.count})
            </option>
          ))}
        </select>

        <select
          name="tag"
          value={params.tag || ''}
          onChange={handleSelectChange('tag')}
          className="min-w-36 rounded-lg border border-surface-outline/60 bg-surface-canvas/80 px-3 py-2 text-sm text-text-primary shadow-subtle focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-surface-panel/80"
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name} ({tag.count})
            </option>
          ))}
        </select>

        <button type="submit" className="hidden" aria-hidden="true">
          Apply
        </button>
      </form>
    </div>
  )
}
