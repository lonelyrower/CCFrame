'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface CountableOption {
  id: string
  title?: string
  name?: string
  _count: {
    photos: number
  }
}

interface FilterParams {
  search?: string
  sort?: string
  album?: string
  tag?: string
  view?: string
}

interface PhotosFiltersProps {
  albums: CountableOption[]
  tags: CountableOption[]
  params: FilterParams
}

export function PhotosFilters({ albums, tags, params }: PhotosFiltersProps) {
  const sortValue = params.sort ?? 'newest'
  const albumValue = params.album ?? ''
  const tagValue = params.tag ?? ''
  const searchParamValue = params.search ?? ''
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState(searchParamValue)

  const currentParams = useMemo(() => {
    const entries = searchParams ? Array.from(searchParams.entries()) : []
    return new URLSearchParams(entries)
  }, [searchParams])

  useEffect(() => {
    setSearchValue(searchParamValue)
  }, [searchParamValue])

  const applyFilters = useCallback(
    (updates: Record<string, string | null>) => {
      startTransition(() => {
        try {
          setError(null)
          const next = new URLSearchParams(currentParams)
          next.delete('cursor')
          next.delete('limit')

          Object.entries(updates).forEach(([key, value]) => {
            if (value && value.trim().length > 0) {
              next.set(key, value)
            } else {
              next.delete(key)
            }
          })

          const queryString = next.toString()
          const target = queryString ? `${pathname}?${queryString}` : pathname
          router.replace(target, { scroll: false })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unable to update filters')
        }
      })
    },
    [currentParams, pathname, router]
  )

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      applyFilters({ search: searchValue || null })
    },
    [applyFilters, searchValue]
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700" aria-busy={pending}>
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-60">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              name="search"
              placeholder="Search photos, albums or tags..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="w-full pl-10 pr-24 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
              disabled={pending}
            >
              Search
            </button>
          </form>
        </div>

        <select
          value={sortValue}
          onChange={(event) => applyFilters({ sort: event.target.value })}
          disabled={pending}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Album name</option>
          <option value="size">File size</option>
        </select>

        <select
          value={albumValue}
          onChange={(event) => applyFilters({ album: event.target.value || null })}
          disabled={pending}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">All albums</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title} ({album._count.photos})
            </option>
          ))}
        </select>

        <select
          value={tagValue}
          onChange={(event) => applyFilters({ tag: event.target.value || null })}
          disabled={pending}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name} ({tag._count.photos})
            </option>
          ))}
        </select>
      </div>

      {pending && (
        <div className="mt-3 text-sm text-primary">Updating results...</div>
      )}

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">Failed to update filters: {error}</div>
      )}
    </div>
  )
}
