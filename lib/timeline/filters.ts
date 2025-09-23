import type { TimelineFilterInput, TimelineFilterState } from '@/types/timeline'

function ensureArray(input: string | string[] | undefined): string[] {
  if (!input) return []
  return Array.isArray(input) ? input : [input]
}

function parseYear(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseTimelineFilters(searchParams: Record<string, string | string[] | undefined> | undefined): TimelineFilterState {
  const params = searchParams ?? {}

  const startYear = parseYear(params.start as string | undefined ?? (params.from as string | undefined))
  const endYear = parseYear(params.end as string | undefined ?? (params.to as string | undefined))

  const personas = ensureArray(params.persona ?? params.personas).filter(Boolean)
  const tags = ensureArray(params.tag ?? params.tags).filter(Boolean)

  const state: TimelineFilterState = {
    startYear,
    endYear,
    personas,
    tags,
  }

  if (state.startYear && state.endYear && state.startYear > state.endYear) {
    return {
      ...state,
      startYear: state.endYear,
      endYear: state.startYear,
    }
  }

  return state
}

export function buildTimelineSearchParams(filters: TimelineFilterInput): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.startYear) params.set('start', String(filters.startYear))
  if (filters.endYear) params.set('end', String(filters.endYear))

  filters.personas?.forEach((persona) => {
    if (persona) params.append('persona', persona)
  })

  filters.tags?.forEach((tag) => {
    if (tag) params.append('tag', tag)
  })

  return params
}

export function toggleValue(current: string[], value: string): string[] {
  if (current.includes(value)) {
    return current.filter((entry) => entry !== value)
  }
  return [...current, value]
}

export function removeEmptyFilters(filters: TimelineFilterState): TimelineFilterInput {
  const next: TimelineFilterInput = {
    personas: filters.personas.filter(Boolean),
    tags: filters.tags.filter(Boolean),
  }

  if (filters.startYear) next.startYear = filters.startYear
  if (filters.endYear) next.endYear = filters.endYear

  return next
}
