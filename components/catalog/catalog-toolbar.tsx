import type { ReactNode } from 'react'

import { Surface } from '@/components/ui/surface'
import { Text } from '@/components/ui/typography'

import { CatalogViewToggle } from './catalog-view-toggle'

const numberFormatter = new Intl.NumberFormat('zh-CN')

export interface CatalogToolbarProps {
  view: 'masonry' | 'grid' | 'list'
  total?: number
  filters?: ReactNode
  actions?: ReactNode
  search?: ReactNode
  meta?: ReactNode
}

export function CatalogToolbar({ view, total, filters, actions, search, meta }: CatalogToolbarProps) {
  const summary = typeof total === 'number' ? `共 ${numberFormatter.format(total)} 张作品` : '作品目录'

  return (
    <Surface tone="panel" padding="lg" className="shadow-subtle space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {search ? <div className="min-w-[240px] flex-1">{search}</div> : null}
        <div className="flex items-center gap-3">
          {actions}
          <CatalogViewToggle value={view} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text size="sm" tone="secondary">
          {summary}
        </Text>
        {meta}
      </div>

      {filters ? <div>{filters}</div> : null}
    </Surface>
  )
}
