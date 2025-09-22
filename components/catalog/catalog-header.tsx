import Link from 'next/link'
import type { ReactNode } from 'react'

import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'

export interface CatalogHeaderStat {
  label: string
  value: string
}

export interface CatalogQuickLink {
  href: string
  label: string
  description?: string
  icon?: ReactNode
}

export interface CatalogHeaderProps {
  title: string
  description?: string
  stats?: CatalogHeaderStat[]
  quickLinks?: CatalogQuickLink[]
  actions?: ReactNode
}

export function CatalogHeader({ title, description, stats, quickLinks, actions }: CatalogHeaderProps) {
  return (
    <Surface tone="panel" padding="lg" className="shadow-subtle space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Heading size="lg">{title}</Heading>
          {description ? (
            <Text tone="secondary" size="sm" className="max-w-3xl">
              {description}
            </Text>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {stats && stats.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-surface-outline/40 bg-surface-canvas/60 px-4 py-3 shadow-subtle"
            >
              <p className="text-sm font-semibold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {quickLinks && quickLinks.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex min-w-[160px] flex-1 flex-col gap-1 rounded-lg border border-surface-outline/30 bg-surface-panel/60 px-4 py-3 text-left shadow-subtle transition hover:border-primary/40 hover:bg-surface-panel/80"
            >
              <span className="text-sm font-medium text-text-primary transition group-hover:text-primary">
                {link.label}
              </span>
              {link.description ? (
                <span className="text-xs text-text-muted">{link.description}</span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </Surface>
  )
}
