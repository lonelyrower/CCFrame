import Image from 'next/image'
import Link from 'next/link'

import type { PhotoWithDetails } from '@/types'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { ContentRail } from '@/components/layout/content-rail'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { getImageUrl, toBase64 } from '@/lib/utils'

interface LandingShowcaseProps {
  photos: PhotoWithDetails[]
}

const fallbackBlur = `data:image/svg+xml;base64,${toBase64('<svg width="320" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="200" fill="#e5e7eb" /></svg>')}`

export function LandingShowcase({ photos }: LandingShowcaseProps) {
  const items = photos.slice(0, 12)

  if (items.length === 0) {
    return null
  }

  return (
    <section>
      <Container size="xl" bleed="none" className="py-16">
        <Surface padding="lg" className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Heading size="lg">灵感速览</Heading>
              <Text tone="secondary">从最新上传中选取的 12 张作品，随时更新。</Text>
            </div>
            <Link href="/photos" className="text-sm text-primary hover:underline">
              查看全部作品
            </Link>
          </div>
          <AnimateOnScroll>
            <ContentRail snapMode="proximity">
              {items.map((photo) => (
                <div
                  key={photo.id}
                  className="relative h-52 min-w-[220px] overflow-hidden rounded-2xl border border-surface-outline/40 bg-surface-panel shadow-subtle"
                >
                  <Image
                    src={getImageUrl(photo.id, 'medium', 'webp')}
                    alt={photo.album?.title || photo.tags[0]?.tag.name || '精选作品'}
                    fill
                    sizes="220px"
                    placeholder="blur"
                    blurDataURL={fallbackBlur}
                    className="object-cover transition-transform duration-500 ease-[var(--ease-out)] hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-3 text-xs text-white">
                    <div className="font-medium">{photo.album?.title || '独立照片'}</div>
                    {photo.tags.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-white/70">
                        {photo.tags.slice(0, 2).map(({ tag }) => (
                          <span key={tag.id}>#{tag.name}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </ContentRail>
          </AnimateOnScroll>
        </Surface>
      </Container>
    </section>
  )
}
