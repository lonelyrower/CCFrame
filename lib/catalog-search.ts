export type CatalogSearchFilter = {
  search?: string | null
  album?: string | null
  tags?: string[] | null
  colors?: string[] | null
  sort?: string | null
  view?: string | null
}

export type CatalogSearchSuggestion = {
  id: string
  label: string
  description?: string
  type: 'album' | 'tag' | 'keyword' | 'color'
  filters: CatalogSearchFilter
  keywords?: string[]
}

export function filterCatalogSuggestions(
  term: string,
  suggestions: CatalogSearchSuggestion[],
  limit = 6,
): CatalogSearchSuggestion[] {
  if (!term) {
    return suggestions.slice(0, limit)
  }

  const normalized = term.trim().toLowerCase()
  if (!normalized) {
    return suggestions.slice(0, limit)
  }

  const results: CatalogSearchSuggestion[] = []

  for (const suggestion of suggestions) {
    if (results.length >= limit) break

    const haystack = [suggestion.label, suggestion.description, ...(suggestion.keywords ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (haystack.includes(normalized)) {
      results.push(suggestion)
    }
  }

  return results
}

export function buildCatalogQueryString(
  current: URLSearchParams,
  filters: CatalogSearchFilter,
): string {
  const next = new URLSearchParams(current.toString())

  const applyScalar = (key: string, value: string | null | undefined) => {
    if (value === undefined) return
    if (value === null) {
      next.delete(key)
      return
    }
    const trimmed = value.trim()
    if (trimmed) next.set(key, trimmed)
    else next.delete(key)
  }

  const applyArray = (key: string, values: string[] | null | undefined, legacyKeys: string[] = []) => {
    if (values === undefined) return

    next.delete(key)
    legacyKeys.forEach((legacyKey) => next.delete(legacyKey))

    if (values === null || values.length === 0) {
      return
    }

    const unique = Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
    if (unique.length === 0) return

    next.set(key, unique.join(','))
  }

  applyScalar('search', filters.search)
  applyScalar('album', filters.album)
  applyArray('tags', filters.tags, ['tag'])
  applyArray('colors', filters.colors)
  applyScalar('sort', filters.sort)
  applyScalar('view', filters.view)

  return next.toString()
}
