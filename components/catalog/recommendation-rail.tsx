import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Surface } from '@/components/ui/surface'
import { Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import type { CatalogRecommendationItem } from '@/types/catalog'

interface CatalogRecommendationRailProps {
  items: CatalogRecommendationItem[]
  title?: string
}

export function CatalogRecommendationRail({ items, title = '智能推荐' }: CatalogRecommendationRailProps) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <Text size="xs" tone="muted" weight="medium">
        {title}
      </Text>
      <div className="-mx-2 flex gap-3 overflow-x-auto pb-2 pl-2 pr-2 sm:mx-0 sm:overflow-visible sm:px-0">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex min-w-[240px] flex-1 flex-col sm:min-w-[0]"
          >
            <Surface
              tone="panel"
              padding="lg"
              className={cn(
                'h-full space-y-3 border border-surface-outline/40 shadow-subtle transition hover:border-primary/50 hover:shadow-floating',
                'flex flex-col'
              )}
              style={item.accentColor ? { boxShadow: `inset 0 0 0 1px ${item.accentColor}33` } : undefined}
            >
              <div className="space-y-2">
                {item.badge ? (
                  <span
                    className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    style={item.accentColor ? { color: item.accentColor } : undefined}
                  >
                    {item.badge}
                  </span>
                ) : null}
                <p className="text-base font-semibold text-text-primary line-clamp-2">{item.title}</p>
                <Text size="sm" tone="secondary" className="line-clamp-3">
                  {item.description}
                </Text>
              </div>

              {item.stats ? (
                <Text size="xs" tone="muted" className="mt-auto">
                  {item.stats}
                </Text>
              ) : null}

              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary transition group-hover:gap-3">
                <span>查看详情</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </div>
            </Surface>
          </Link>
        ))}
      </div>
    </div>
  )
}
