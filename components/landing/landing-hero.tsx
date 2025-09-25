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
                  <span>来自 CC Frame 的每日灵感</span>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.05}>
                <div className="space-y-4 text-balance">
                  <Overline className="text-text-muted">我的摄影时光</Overline>
                  <Heading as="h1" size="xl" className="text-balance text-text-inverted">
                    捕捉光影，讲述属于你的摄影故事
                  </Heading>
                  <Text size="lg" tone="secondary" className="max-w-xl text-text-inverted/80">
                    在这里，每一张照片都有它的故事。通过精心策展的影像，展现生活中的美好瞬间与独特视角。
                  </Text>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.1}>
                <div className="flex flex-wrap gap-4">
                  <Button asChild size="lg">
                    <Link href="/photos">浏览作品集</Link>
                  </Button>
                  <Button asChild variant="glass" size="lg">
                    <Link href="#collections">探索系列作品</Link>
                  </Button>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={0.15}>
                <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricItem label="公开作品" value={metrics.totalPhotos} suffix="+" />
                  <MetricItem label="近 30 日新增" value={metrics.recentPhotosCount} />
                  <MetricItem label="主题标签" value={metrics.totalTags} />
                  <MetricItem label="精选相册" value={metrics.totalAlbums} />
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
                        alt={photo.album?.title || '精选作品'}
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
