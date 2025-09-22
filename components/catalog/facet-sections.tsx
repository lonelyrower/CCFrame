import Image from 'next/image'
import Link from 'next/link'

import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { getImageUrl } from '@/lib/utils'
import type { CatalogFacetItem } from '@/types/catalog'

interface CatalogFacetSectionsProps {
  items: CatalogFacetItem[]
  title?: string
}

export function CatalogFacetSections({ items, title = '主题分面' }: CatalogFacetSectionsProps) {
  if (items.length === 0) return null

  return (
    <div className="space-y-4">
      <Text size="xs" tone="muted" weight="medium">
        {title}
      </Text>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((facet) => (
          <Surface
            key={facet.id}
            tone="panel"
            padding="lg"
            className="space-y-4 border border-surface-outline/40 shadow-subtle"
            style={facet.accentColor ? { boxShadow: `inset 0 0 0 1px ${facet.accentColor}33` } : undefined}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <Heading size="sm">{facet.title}</Heading>
                {facet.subtitle ? (
                  <Text size="xs" tone="muted">
                    {facet.subtitle}
                  </Text>
                ) : null}
              </div>
              <Link
                href={facet.href}
                className="text-sm font-medium text-primary transition hover:text-primary/80"
              >
                浏览更多 →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {facet.photos.slice(0, 6).map((photo) => (
                <div
                  key={`${facet.id}-${photo.id}`}
                  className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-canvas"
                >
                  <Image
                    src={getImageUrl(photo.id, 'small', 'webp')}
                    alt={photo.album?.title || photo.tags[0]?.tag?.name || 'catalog preview'}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 20vw, 200px"
                    className="object-cover transition duration-300 ease-[var(--ease-out)] group-hover:scale-[1.05]"
                  />
                </div>
              ))}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  )
}
