import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/layout/container'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import type { LandingAlbumHighlight } from '@/lib/landing-data'
import { getImageUrl } from '@/lib/utils'
import type { PhotoWithDetails } from '@/types'

interface HomeStoryProps {
  statement?: string
  albums: LandingAlbumHighlight[]
  featuredPhotos: PhotoWithDetails[]
}

const storyParagraphs = [
  '我喜欢在晨光与暮色的交界按下快门，那些不经意的微光会悄悄携带情绪，像是写给自己的一封轻柔的信。每一次凝视取景器，都是在与时间进行一场静默的对话。',
  '拍摄对我来说是一场缓慢而深情的对话——与城市的角落、与山海的呼吸、也与每一个被我遇见的温柔灵魂。镜头记录的不只是画面，更是那些稍纵即逝却永恒存在的心绪与情感。',
  '每一张照片背后都有一个故事，每一个故事都承载着一份真挚的情感。这里不是展示技巧的舞台，而是分享内心世界的温暖角落。',
]

export function HomeStory({ statement, albums, featuredPhotos }: HomeStoryProps) {
  const collage = featuredPhotos.slice(0, 3)
  const highlightAlbum = albums[0]
  const voiceover = statement?.trim() || storyParagraphs[0]

  return (
    <section className="relative isolate overflow-hidden py-32 sm:py-40" id="story">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-black/10 to-black/40" aria-hidden />
      <div className="absolute inset-0 -z-10 opacity-20" style={{ background: 'var(--token-gradient-glow-primary)' }} />

      <Container className="relative grid gap-16 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-20">
        <AnimateOnScroll className="space-y-10 text-white">
          <div className="space-y-6">
            <p className="text-sm font-light uppercase tracking-[0.5em] text-white/45" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
              镜头背后的声音
            </p>
            <h2 className="text-4xl font-light leading-tight sm:text-6xl" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>
              创作者的自白，<br className="hidden sm:block" />用心诉说的故事
            </h2>
          </div>
          <blockquote className="space-y-8 rounded-3xl border border-white/8 bg-white/[0.03] p-12 backdrop-blur-xl">
            <p className="text-2xl font-light text-white/95 leading-relaxed narrative-text" style={{ fontFamily: 'var(--token-typography-narrative-font-family)' }}>
              "{voiceover}"
            </p>
            {storyParagraphs.slice(1).map((paragraph, index) => (
              <p key={paragraph} className="text-lg font-light leading-relaxed text-white/75 narrative-text" style={{ fontFamily: 'var(--token-typography-narrative-font-family)' }}>
                {paragraph}
              </p>
            ))}
            <footer className="pt-6 text-xs font-light uppercase tracking-[0.4em] text-white/40" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
              用耐心捕捉 · 以光影书写
            </footer>
          </blockquote>
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/timeline"
              className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-transparent px-8 py-4 text-base font-light text-white/85 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-white/10 hover:text-white hover:scale-[1.02]"
              style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
            >
              时间线故事
              <span className="text-white/50 transition-colors group-hover:text-white/80">→</span>
            </Link>
            <Link
              href="/tags"
              className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-transparent px-8 py-4 text-base font-light text-white/65 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/5 hover:text-white/85"
              style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
            >
              情绪标签宇宙
              <span className="text-white/40 transition-colors group-hover:text-white/70">→</span>
            </Link>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.2} className="relative lg:mt-16">
          <div className="relative grid gap-6 rounded-3xl border border-white/8 bg-white/[0.02] p-8 backdrop-blur-xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-white/[0.02] opacity-60" aria-hidden />
            <div className="relative grid grid-cols-2 gap-6">
              {collage.map((photo, index) => (
                <div
                  key={`story-collage-${photo.id}-${index}`}
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
                    index === 0 ? 'col-span-2 h-64 sm:h-72' : 'h-48 sm:h-52'
                  }`}
                >
                  <Image
                    src={getImageUrl(photo.id, index === 0 ? 'large' : 'medium', 'webp')}
                    alt={photo.title || '创作瞬间'}
                    fill
                    sizes={index === 0 ? '600px' : '320px'}
                    className="object-cover saturate-[1.05] transition-all duration-500 group-hover:saturate-[1.1] group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
              ))}
            </div>
            {highlightAlbum && (
              <div className="relative mt-6 rounded-2xl border border-white/8 bg-black/20 p-8 text-white backdrop-blur-sm">
                <p className="text-xs font-light uppercase tracking-[0.4em] text-white/40" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                  精选系列
                </p>
                <h3 className="mt-3 text-2xl font-light text-white" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>
                  {highlightAlbum.title || '未命名专辑'}
                </h3>
                <p className="mt-4 text-base font-light leading-relaxed text-white/65 narrative-text" style={{ fontFamily: 'var(--token-typography-narrative-font-family)' }}>
                  {highlightAlbum.description || '从无数次按下快门的温度里挑选出的心绪片段，每一帧都承载着情感的重量。'}
                </p>
                <Link
                  href={`/photos?album=${encodeURIComponent(highlightAlbum.id)}`}
                  className="group mt-6 inline-flex items-center gap-3 rounded-full bg-white/8 px-6 py-3 text-sm font-light text-white/90 transition-all duration-300 hover:bg-white/15 hover:scale-105"
                  style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
                >
                  浏览完整系列
                  <span aria-hidden className="text-white/60 transition-all group-hover:text-white/90 group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            )}
          </div>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}
