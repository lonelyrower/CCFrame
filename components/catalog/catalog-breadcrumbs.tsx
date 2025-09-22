import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface CatalogBreadcrumbItem {
  label: string
  href?: string
}

export interface CatalogBreadcrumbsProps {
  items: CatalogBreadcrumbItem[]
  className?: string
}

export function CatalogBreadcrumbs({ items, className }: CatalogBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-xs text-text-muted', className)}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn(isLast ? 'text-text-primary font-medium' : '')}>{item.label}</span>
              )}
              {!isLast ? <ChevronRight className="h-3 w-3" aria-hidden /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
