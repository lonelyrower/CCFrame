"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

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
}

export function PhotosFilters({ albums, tags, params }: PhotosFiltersProps) {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
      <form className="flex flex-wrap gap-4" onSubmit={handleSearchSubmit}>
        <div className="flex-1 min-w-60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="search"
              name="search"
              placeholder="搜索照片、相册或标签..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <select
          name="sort"
          value={params.sort || 'newest'}
          onChange={handleSelectChange('sort')}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="newest">最新上传</option>
          <option value="oldest">最早上传</option>
          <option value="name">相册名称</option>
        </select>

        <select
          name="album"
          value={params.album || ''}
          onChange={handleSelectChange('album')}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">所有相册</option>
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
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">所有标签</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name} ({tag.count})
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="hidden"
          aria-hidden="true"
        >
          应用
        </button>
      </form>
    </div>
  )
}

