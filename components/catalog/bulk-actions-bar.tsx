"use client"

import { useMemo } from 'react'
import { Layers, Mail, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { useCompare } from './compare-provider'

function buildMailto(ids: string[]): string {
  const subject = encodeURIComponent('CC Frame Catalog 询问')
  const body = encodeURIComponent(`您好，我想进一步了解这些作品：
${ids.join(', ')}`)
  return `mailto:studio@example.com?subject=${subject}&body=${body}`
}

export function CatalogBulkActions() {
  const compare = useCompare()

  const summary = useMemo(
    () => ({
      compare: compare.items.length,
      compareIds: compare.items.map((item) => item.id),
    }),
    [compare.items],
  )

  if (summary.compare === 0) {
    return null
  }

  const handleContact = () => {
    if (summary.compareIds.length === 0) return
    window.open(buildMailto(summary.compareIds), '_blank')
  }

  return (
    <Surface
      tone="panel"
      padding="md"
      className="flex flex-wrap items-center justify-between gap-3 border border-surface-outline/40 shadow-subtle"
    >
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Layers className="h-4 w-4 text-primary" />
        <span>对比 {summary.compare}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="default"
          className="gap-2"
          onClick={handleContact}
          disabled={summary.compareIds.length === 0}
        >
          <Mail className="h-4 w-4" />
          联系我们
        </Button>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => compare.clear()}>
          <X className="h-4 w-4" />
          清空对比
        </Button>
      </div>
    </Surface>
  )
}
