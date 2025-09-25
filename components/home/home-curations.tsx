import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/layout/container'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import type { LandingAlbumHighlight, LandingTagHighlight } from '@/lib/landing-data'
import { getImageUrl } from '@/lib/utils'
import type { PhotoWithDetails } from '@/types'

interface HomeCurationsProps {
  photos: PhotoWithDetails[]
  tags: LandingTagHighlight[]
  albums: LandingAlbumHighlight[]
}

type ThemeCard = {
  id: string
  title: string
  description: string
  accent: string
  href: string
  samples: PhotoWithDetails[]
}

export function HomeCurations({ photos, tags, albums }: HomeCurationsProps) {
  const tagThemes: ThemeCard[] = tags.slice(0, 4).map((tag) => {
    const related = photos
      .filter((photo) => photo.tags.some((entry) => entry.tag.id === tag.id))
      .slice(0, 3)

    return {
      id: tag.id,
      title: tag.name,
      description: `来自 ${tag.photoCount} 张作品的情绪摘录`,
      accent: tag.color || '#f1f5f9',
      href: `/photos?tags=${encodeURIComponent(tag.name)}`,
      samples: related,
    }
  })

  const albumThemes: ThemeCard[] = albums.slice(0, 4).map((album) => {
    const cover = album.coverPhoto as PhotoWithDetails | undefined

    return {
      id: album.id,
      title: album.title || '未命名专辑',
      description: album.description || `收纳了 ${album.photoCount} 个瞬间`,
      accent: '#e2d4c6',
      href: `/photos?album=${encodeURIComponent(album.id)}`,
      samples: cover ? [cover] : photos.filter((photo) => photo.album?.id === album.id).slice(0, 1),
    }
  })

  const themes = tagThemes.length > 0 ? tagThemes : albumThemes

  return (
    <section className="relative isolate overflow-hidden py-32 sm:py-40" id="curations" style={{ background: 'var(--token-gradient-glow-secondary)' }}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/20 via-black/5 to-black/30" aria-hidden />
      <Container className="space-y-20">
        <AnimateOnScroll>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-6 text-white">
              <p className="text-sm font-light uppercase tracking-[0.5em] text-white/50" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                精选策展章节
              </p>
              <h2 className="text-4xl font-light leading-tight sm:text-6xl" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>
                以主题写情绪，<br className="hidden sm:block" />用光影诉心声
              </h2>
              <p className="text-lg font-light leading-relaxed text-white/65 narrative-text" style={{ fontFamily: 'var(--token-typography-narrative-font-family)' }}>
                以情绪与时间的维度将作品编织成故事。每一个主题都是一次深入内心的旅行，滑动卡片，沿着不同的情绪路径走进创作的源头。
              </p>
            </div>
            <Link
              href="/photos"
              className="group inline-flex items-center gap-3 self-start rounded-full border border-white/15 bg-transparent px-8 py-4 text-base font-light text-white/75 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white hover:scale-[1.02]"
              style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
            >
              查看全部作品
              <span className="text-white/50 transition-colors group-hover:text-white/80">→</span>
            </Link>
          </div>
        </AnimateOnScroll>

        <div className="flex snap-x gap-8 overflow-x-auto pb-6 scrollbar-hide">
          {themes.map((theme) => (
            <AnimateOnScroll key={theme.id} className="snap-center">
              <article className="group relative flex min-h-[360px] min-w-[320px] max-w-sm flex-col justify-between overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02] p-10 text-white shadow-[0_32px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all duration-700 hover:border-white/15 hover:bg-white/[0.05] hover:scale-[1.02] hover:shadow-[0_40px_100px_rgba(212,163,115,0.08)]">
                <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-soft-light" style={{ background: `radial-gradient(circle at 25% 25%, ${theme.accent}30, transparent 65%)` }} />
                <div className="relative z-10 space-y-6">
                  <span className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs font-light uppercase tracking-[0.4em] text-white/50 transition-colors group-hover:text-white/70" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                    主题策展
                  </span>
                  <h3 className="text-3xl font-light leading-tight" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>{theme.title}</h3>
                  <p className="text-base font-light leading-relaxed text-white/60 transition-colors group-hover:text-white/75" style={{ fontFamily: 'var(--token-typography-narrative-font-family)' }}>{theme.description}</p>
                </div>
                <div className="relative z-10 mt-8">
                  <div className="flex -space-x-4 mb-8">
                    {theme.samples.length > 0 ? (
                      theme.samples.map((photo, index) => (
                        <div
                          key={`${theme.id}-${photo.id}-${index}`}
                          className="photo-card relative h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-lg transition-all duration-300"
                          style={{ zIndex: theme.samples.length - index }}
                        >
                          <Image
                            src={getImageUrl(photo.id, 'small', 'webp')}
                            alt={photo.title || theme.title}
                            fill
                            sizes="80px"
                            className="object-cover saturate-[1.1]"
                            loading="lazy"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-white/15 text-xs font-light text-white/40" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                        敬请期待
                      </div>
                    )}
                  </div>
                  <Link
                    href={theme.href}
                    className="group inline-flex items-center gap-3 rounded-full bg-white/8 px-6 py-3 text-sm font-light text-white/90 transition-all duration-300 hover:bg-white/15 hover:scale-105"
                    style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
                  >
                    进入主题
                    <span aria-hidden className="text-base leading-none opacity-60 transition-all group-hover:opacity-100 group-hover:translate-x-0.5">↗</span>
                  </Link>
                </div>
              </article>
            </AnimateOnScroll>
          ))}
        </div>
      </Container>
    </section>
  )
}
