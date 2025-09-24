"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Command as CommandIcon, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  buildCatalogQueryString,
  filterCatalogSuggestions,
  type CatalogSearchFilter,
  type CatalogSearchSuggestion,
} from '@/lib/catalog-search'
import { useCommandPalette } from '@/components/providers/command-palette-provider'

const suggestionTypeLabel: Record<CatalogSearchSuggestion['type'], string> = {
  album: '专辑',
  tag: '标签',
  keyword: '搜索',
  color: '色彩',
}

export interface CatalogSearchBarProps {
  initialValue?: string
  suggestions?: CatalogSearchSuggestion[]
  placeholder?: string
  className?: string
}

export function CatalogSearchBar({
  initialValue,
  suggestions = [],
  placeholder = '搜索作品、标签或系列',
  className,
}: CatalogSearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { open: openCommandPalette, registerCommand } = useCommandPalette()

  const [value, setValue] = useState(initialValue ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(initialValue ?? '')
  }, [initialValue])

  useEffect(() => {
    const dispose = registerCommand({
      id: 'catalog-search-focus',
      title: '聚焦作品搜索',
      subtitle: '快速定位目录并输入关键词',
      group: 'Catalog',
      shortcut: ['/', 'S'],
      perform: () => {
        inputRef.current?.focus()
        setTimeout(() => setIsOpen(true), 0)
      },
    })

    return dispose
  }, [registerCommand])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key === '/' && !(event.metaKey || event.ctrlKey || event.altKey)) {
        const target = event.target as HTMLElement | null
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return
        }
        event.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filteredSuggestions = useMemo(() => {
    return filterCatalogSuggestions(value, suggestions)
  }, [suggestions, value])

  useEffect(() => {
    setActiveIndex(0)
  }, [value])

  const applyFilters = (filters: CatalogSearchFilter) => {
    const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : '')
    const query = buildCatalogQueryString(currentParams, filters)
    startTransition(() => {
      const target = query ? `${pathname}?${query}` : pathname
      router.replace(target, { scroll: false })
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    applyFilters({ search: value })
    setIsOpen(false)
  }

  const handleSelect = (suggestion: CatalogSearchSuggestion) => {
    applyFilters(suggestion.filters)
    if (suggestion.filters.search !== undefined) {
      setValue(suggestion.filters.search ?? '')
    }
    setIsOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && filteredSuggestions.length > 0) {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((prev) => (prev + 1) % filteredSuggestions.length)
    }
    if (event.key === 'ArrowUp' && filteredSuggestions.length > 0) {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length)
    }
    if (event.key === 'Enter' && filteredSuggestions.length > 0 && isOpen) {
      const suggestion = filteredSuggestions[activeIndex]
      if (suggestion) {
        event.preventDefault()
        handleSelect(suggestion)
      }
    }
    if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const showPanel = isOpen && filteredSuggestions.length > 0

  return (
    <div className={cn('relative w-full', className)}>
      <form
        className="flex items-center gap-2 rounded-lg border border-surface-outline/50 bg-surface-canvas/90 px-3 py-2 text-sm shadow-subtle backdrop-blur-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20"
        onSubmit={handleSubmit}
      >
        <Search className="h-4 w-4 text-text-muted" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          aria-label="搜索作品"
        />
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-text-muted md:inline-flex">
            按 <kbd className="mx-1 rounded border border-surface-outline/50 px-1.5 py-0.5 text-[10px] font-medium">/</kbd> 快速聚焦
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-text-muted hover:text-text-primary"
            onClick={() => openCommandPalette()}
            aria-label="打开命令面板"
          >
            <CommandIcon className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </form>

      {showPanel ? (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-surface-outline/40 bg-surface-panel/95 shadow-floating backdrop-blur-md">
          <ul role="listbox" aria-label="搜索建议">
            {filteredSuggestions.map((suggestion, index) => {
              const colorValue = suggestion.filters.colors?.[0]
              return (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(suggestion)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition',
                      index === activeIndex ? 'bg-primary/10 text-primary' : 'hover:bg-surface-outline/40',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{suggestion.label}</p>
                      {suggestion.description ? (
                        <p className="truncate text-xs text-text-muted">{suggestion.description}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      {suggestion.type === 'color' && colorValue ? (
                        <span
                          className="h-3 w-3 rounded-full border border-contrast-outline/60"
                          style={{ backgroundColor: colorValue }}
                          aria-hidden
                        />
                      ) : null}
                      <span>{suggestionTypeLabel[suggestion.type]}</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
