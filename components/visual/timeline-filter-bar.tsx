"use client"

import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import type { TimelineFilterOptions, TimelineFilterState } from '@/types/timeline'
import { buildTimelineSearchParams, toggleValue } from '@/lib/timeline/filters'
import { cn } from '@/lib/utils'

interface TimelineFilterBarProps {
  options: TimelineFilterOptions
  active: TimelineFilterState
  availableYears: {
    min: number | null
    max: number | null
  }
  className?: string
  basePath?: string
}

export function TimelineFilterBar({ options, active, availableYears, className, basePath = '/timeline' }: TimelineFilterBarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const yearOptions = useMemo(() => options.years, [options.years])

  const updateFilters = (nextState: TimelineFilterState) => {
    startTransition(() => {
      const params = buildTimelineSearchParams(nextState)
      const query = params.toString()
      router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false })
    })
  }

  const handleYearChange = (key: 'startYear' | 'endYear', value: string) => {
    const numericValue = value ? Number.parseInt(value, 10) : undefined
    const nextState: TimelineFilterState = {
      startYear: key === 'startYear' ? numericValue : active.startYear,
      endYear: key === 'endYear' ? numericValue : active.endYear,
      personas: [...active.personas],
      tags: [...active.tags],
    }
    updateFilters(nextState)
  }

  const handlePersonaToggle = (personaId: string) => {
    const nextState: TimelineFilterState = {
      ...active,
      personas: toggleValue(active.personas, personaId),
      tags: [...active.tags],
    }
    updateFilters(nextState)
  }

  const handleTagToggle = (tagId: string) => {
    const nextState: TimelineFilterState = {
      ...active,
      personas: [...active.personas],
      tags: toggleValue(active.tags, tagId),
    }
    updateFilters(nextState)
  }

  const handleClear = () => {
    startTransition(() => {
      router.replace(basePath, { scroll: false })
    })
  }

  return (
    <section
      className={cn(
        'rounded-[32px] border border-contrast-outline/10 bg-contrast-surface/40 p-6 backdrop-blur-xl md:p-8',
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1 text-text-inverted">
          <p className="text-xs uppercase tracking-[0.4em] text-text-inverted/50">Timeline Filters</p>
          <h2 className="text-xl font-semibold">筛选你的故事轨迹</h2>
          {availableYears.min && availableYears.max ? (
            <p className="text-xs text-text-inverted/50">
              时间范围 {availableYears.min} - {availableYears.max}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleClear}
          disabled={isPending}
          className="self-start rounded-full border border-contrast-outline/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-text-inverted/60 transition hover:text-text-inverted disabled:opacity-50"
        >
          清除筛选
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-text-inverted/70">
            起始年份
            <select
              className="w-full rounded-2xl border border-contrast-outline/10 bg-contrast-surface/30 px-4 py-3 text-sm text-text-inverted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              value={active.startYear ?? ''}
              onChange={(event) => handleYearChange('startYear', event.target.value)}
              disabled={isPending}
            >
              <option value="">全部年份</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-text-inverted/70">
            结束年份
            <select
              className="w-full rounded-2xl border border-contrast-outline/10 bg-contrast-surface/30 px-4 py-3 text-sm text-text-inverted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              value={active.endYear ?? ''}
              onChange={(event) => handleYearChange('endYear', event.target.value)}
              disabled={isPending}
            >
              <option value="">全部年份</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-text-inverted/50">人物/系列</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {options.personas.map((persona) => {
                const isActive = active.personas.includes(persona.id)
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => handlePersonaToggle(persona.id)}
                    disabled={isPending}
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                      isActive ? 'border-contrast-outline bg-surface-panel/10 text-text-inverted' : 'border-contrast-outline/15 text-text-inverted/60 hover:text-text-inverted',
                    )}
                    style={isActive && persona.accentColor ? { borderColor: persona.accentColor, color: persona.accentColor } : undefined}
                  >
                    {persona.name}
                    <span className="ml-2 text-[10px] font-normal opacity-70">{persona.count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-text-inverted/50">标签</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {options.tags.map((tag) => {
                const isActive = active.tags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    disabled={isPending}
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                      isActive ? 'border-contrast-outline bg-surface-panel/10 text-text-inverted' : 'border-contrast-outline/15 text-text-inverted/60 hover:text-text-inverted',
                    )}
                    style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                  >
                    {tag.name}
                    <span className="ml-2 text-[10px] font-normal opacity-70">{tag.count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
