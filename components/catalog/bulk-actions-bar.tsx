
"use client"

import { useMemo } from 'react'
import { Layers, Mail, Star, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { Text } from '@/components/ui/typography'
import { useCompare } from './compare-provider'
import { useFavorites } from './favorite-provider'

function buildMailto(ids: string[]): string {
  const subject = encodeURIComponent('CC Frame Catalog 咨询')
  const body = encodeURIComponent(`您好，想进一步咨询以下作品：
${ids.join(', ')}`)
  return `mailto:studio@example.com?subject=${subject}&body=${body}`
}

export function CatalogBulkActions() {
  const compare = useCompare()
  const favorites = useFavorites()

  const summary = useMemo(
    () => ({
      favorites: favorites.count,
      compare: compare.items.length,
      favoriteIds: favorites.items.map((item) => item.id),
      compareIds: compare.items.map((item) => item.id),
    }),
    [favorites.count, favorites.items, compare.items],
  )

  if (summary.favorites === 0 && summary.compare === 0) {
    return null
  }

  const handleContact = () => {
    const ids = Array.from(new Set([...summary.favoriteIds, ...summary.compareIds]))
    if (ids.length === 0) return
    window.open(buildMailto(ids), '_blank')
  }

  return (
    <Surface
      tone="panel"
      padding="md"
      className="flex flex-wrap items-center justify-between gap-3 border border-surface-outline/40 shadow-subtle"
    >
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Star className="h-4 w-4 text-primary" />
        <span>收藏 {summary.favorites}</span>
        <span className="text-text-muted">·</span>
        <Layers className="h-4 w-4 text-primary" />
        <span>对比 {summary.compare}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="default"
          className="gap-2"
          onClick={handleContact}
          disabled={summary.favoriteIds.length + summary.compareIds.length === 0}
        >
          <Mail className="h-4 w-4" />
          联系顾问
        </Button>
        {summary.compare > 0 ? (
          <Button size="sm" variant="outline" className="gap-2" onClick={() => compare.clear()}>
            <X className="h-4 w-4" />
            清空对比
          </Button>
        ) : null}
        {summary.favorites > 0 ? (
          <Button size="sm" variant="outline" className="gap-2" onClick={() => favorites.clear()}>
            <X className="h-4 w-4" />
            清空收藏
          </Button>
        ) : null}
      </div>
    </Surface>
  )
}
