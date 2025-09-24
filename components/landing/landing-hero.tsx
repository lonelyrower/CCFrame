import Image from 'next/image'
import Link from 'next/link'

import type { LandingMetricsSnapshot } from '@/lib/landing-data'
import type { PhotoWithDetails } from '@/types'
import { getImageUrl } from '@/lib/utils'
import { LandingHeroMedia } from './landing-hero-media'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { Heading, Overline, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'

interface LandingHeroProps {
  photos: PhotoWithDetails[]
  metrics: LandingMetricsSnapshot
}

const numberFormatter = new Intl.NumberFormat('zh-CN')

export function LandingHero({ photos, metrics }: LandingHeroProps) {
  const heroPhotos = photos.slice(0, 5)

  return (
    <section className="relative">
      <Container size="xl" bleed="none" className="py-10 sm:py-16 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-surface-outline/20 bg-gradient-to-br from-primary/10 via-surface-canvas to-surface-glass/70 shadow-floating">
          <LandingHeroMedia photos={heroPhotos} />

          <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-24">
            <div className="max-w-3xl space-y-8">
              <AnimateOnScroll>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface-glass/80 px-4 py-2 text-xs font-medium text-primary shadow-subtle backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                  <span>\u6765\u81ea CC Frame \u7684\u6bcf\u65e5\u7075\u611f</span>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.05}>
                <div className="space-y-4 text-balance">
                  <Overline className="text-text-muted">我的摄影时光</Overline>
                  <Heading as="h1" size="xl" className="text-balance text-text-inverted">
                    \u6355\u6349\u5149\u5f71\uff0c\u8bb2\u8ff0\u5c5e\u4e8e\u4f60\u7684\u6444\u5f71\u6545\u4e8b
                  </Heading>
                  <Text size="lg" tone="secondary" className="max-w-xl text-text-inverted/80">
                    \u81ea\u52a8\u6574\u7406\u3001\u8bed\u4e49\u641c\u7d22\u3001\u65f6\u5e8f\u53d9\u4e8b\uff0c\u4ee5\u6781\u81f4\u6027\u80fd\u5448\u73b0\u4f60\u7684\u4f5c\u54c1\u96c6\u3002\u65e0\u8bba\u662f\u54c1\u724c\u6d3b\u52a8\u8fd8\u662f\u79c1\u4eab\u77ac\u95f4\uff0cCC Frame \u90fd\u80fd\u8ba9\u7075\u611f\u88ab\u770b\u89c1\u3002
                  </Text>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.1}>
                <div className="flex flex-wrap gap-4">
                  <Button asChild size="lg">
                    <Link href="/photos">\u6d4f\u89c8\u4f5c\u54c1\u96c6</Link>
                  </Button>
                  <Button asChild variant="glass" size="lg">
                    <Link href="#experience">\u4f53\u9a8c\u667a\u80fd\u7ba1\u7ebf</Link>
                  </Button>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.15}>
                <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricItem label="\u516c\u5f00\u4f5c\u54c1" value={metrics.totalPhotos} suffix="+" />
                  <MetricItem label="\u8fd1 30 \u65e5\u65b0\u589e" value={metrics.recentPhotosCount} />
                  <MetricItem label="\u4e3b\u9898\u6807\u7b7e" value={metrics.totalTags} />
                  <MetricItem label="\u7cbe\u9009\u76f8\u518c" value={metrics.totalAlbums} />
                </dl>
              </AnimateOnScroll>
            </div>

            {heroPhotos.length > 1 ? (
              <AnimateOnScroll delay={0.2}>
                <div className="mt-12 flex flex-wrap gap-4 lg:absolute lg:bottom-16 lg:right-16 lg:flex-nowrap">
                  {heroPhotos.slice(1).map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative h-28 w-28 overflow-hidden rounded-2xl border border-contrast-outline/10 bg-surface-panel/10 shadow-floating backdrop-blur"
                    >
                      <Image
                        src={getImageUrl(photo.id, 'medium', 'webp')}
                        alt={photo.album?.title || '\u7cbe\u9009\u4f5c\u54c1'}
                        fill
                        sizes="112px"
                        className="object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}

function MetricItem({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-contrast-outline/10 bg-surface-panel/10 px-4 py-3 text-left text-text-inverted shadow-subtle backdrop-blur">
      <dt className="text-xs font-medium uppercase tracking-wide text-text-inverted/70">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">
        {numberFormatter.format(value)}
        {suffix ? <span className="text-lg font-normal text-text-inverted/60">{suffix}</span> : null}
      </dd>
    </div>
  )
}
