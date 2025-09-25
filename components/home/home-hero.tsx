"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown, Volume2, VolumeX, Palette, PaletteIcon, Sparkles } from 'lucide-react'

import { Container } from '@/components/layout/container'
import type { LandingMetricsSnapshot } from '@/lib/landing-data'
import { cn, getImageUrl } from '@/lib/utils'
import type { PhotoWithDetails } from '@/types'
import { useImageColorPalette } from '@/components/gallery/use-dominant-color'
import { useDynamicTheme } from '@/components/providers/dynamic-theme-provider'

const MotionDiv = motion.div

interface HomeHeroProps {
  photos: PhotoWithDetails[]
  metrics: LandingMetricsSnapshot
  ambientTrack?: string
}

const numberFormatter = new Intl.NumberFormat('zh-Hans-CN')

export function HomeHero({ photos, metrics, ambientTrack }: HomeHeroProps) {
  const heroPhoto = useMemo(() => photos[0], [photos])
  const heroImage = heroPhoto ? getImageUrl(heroPhoto.id, 'large', 'webp') : null

  // Dynamic theme integration
  const { palette: extractedPalette, isLoading: paletteLoading } = useImageColorPalette(
    heroPhoto?.id || '',
    Boolean(heroPhoto)
  )
  const { palette: activePalette, isActive: themeActive, isLoading: themeLoading, enableDynamicTheme, disableDynamicTheme } = useDynamicTheme()

  // Auto-enable dynamic theme when palette is extracted
  useEffect(() => {
    if (extractedPalette && !themeActive && !themeLoading) {
      // Add a slight delay to let the hero image load first
      const timer = setTimeout(() => {
        enableDynamicTheme(extractedPalette)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [extractedPalette, themeActive, themeLoading, enableDynamicTheme])

  const stats = useMemo(
    () => [
      {
        label: '公开作品',
        value: metrics.totalPhotos,
        hint: '一次次捕捉的微光',
      },
      {
        label: '主题专辑',
        value: metrics.totalAlbums,
        hint: '情绪与记忆的章节',
      },
      {
        label: '情绪标签',
        value: metrics.totalTags,
        hint: '作品与感受的语言',
      },
    ],
    [metrics.totalAlbums, metrics.totalPhotos, metrics.totalTags]
  )

  return (
    <section className="relative isolate overflow-hidden photography-hero" id="hero">
      {heroImage ? (
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={heroPhoto?.title || '精选作品'}
            fill
            sizes="100vw"
            priority
            className="object-cover object-center opacity-80 saturate-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>
      ) : (
        <div className="absolute inset-0" style={{ background: 'var(--token-gradient-hero-backdrop)' }} />
      )}

      <Container className="relative z-10 flex min-h-[85vh] flex-col justify-center gap-16 py-32 sm:py-40">
        <MotionDiv
          className="max-w-4xl space-y-10 text-white"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
        >
          <div className="space-y-4">
            <p className="text-sm font-light uppercase tracking-[0.5em] text-white/60" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
              一场关于光影与情绪的小型展览
            </p>
            <h1 className="text-5xl font-light leading-[1.15] tracking-tight sm:text-7xl" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>
              将镜头化作叙事者，<br className="hidden sm:block" />在光影呼吸之间，<br className="hidden sm:block" />记录我与世界的温柔对话
            </h1>
          </div>
          <p className="max-w-2xl text-lg font-light leading-relaxed text-white/75 sm:text-xl narrative-text">
            每一个画面都源自真实的情绪瞬间——有被风轻抚的树叶、城市夜幕的柔光，也有沉默人群里的心跳。欢迎缓慢地走进来，感受这些被时间轻抚过的故事。
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-8">
            <Link
              href="/photos"
              className="group inline-flex items-center gap-3 rounded-full bg-white/15 px-8 py-4 text-base font-light text-white backdrop-blur-md transition-all duration-300 hover:bg-white/25 hover:scale-[1.02]"
              style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
            >
              进入作品长廊
              <span className="text-white/60 transition-colors group-hover:text-white/80">→</span>
            </Link>
            <button
              type="button"
              onClick={() => document.getElementById('curations')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center gap-3 rounded-full border border-white/20 bg-transparent px-8 py-4 text-base font-light text-white/85 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white hover:scale-[1.02]"
              style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
            >
              探索策展主题
              <span className="text-white/50 transition-colors group-hover:text-white/70">↓</span>
            </button>
          </div>
        </MotionDiv>

        <MotionDiv
          className="grid gap-8 text-white/80 sm:grid-cols-3"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1.0, ease: [0.33, 1, 0.68, 1] }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-500 hover:border-white/15 hover:bg-white/[0.06] hover:scale-[1.02]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            >
              <div className="text-4xl font-light text-white transition-colors group-hover:text-white" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>
                {numberFormatter.format(stat.value)}
              </div>
              <div className="mt-3 text-base font-light text-white/70 transition-colors group-hover:text-white/85" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                {stat.label}
              </div>
              <div className="mt-4 text-xs font-light uppercase tracking-[0.4em] text-white/45 transition-colors group-hover:text-white/60" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                {stat.hint}
              </div>
            </motion.div>
          ))}
        </MotionDiv>
      </Container>

      <AmbientSoundToggle ambientTrack={ambientTrack} />
      <DynamicThemeToggle
        isActive={themeActive}
        isLoading={themeLoading || paletteLoading}
        onToggle={() => themeActive ? disableDynamicTheme() : extractedPalette && enableDynamicTheme(extractedPalette)}
        palette={extractedPalette}
      />

      <motion.div
        className="pointer-events-none absolute bottom-12 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-white/50 sm:flex"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
      >
        <span
          className="text-xs font-light tracking-[0.5em] uppercase"
          style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
        >
          继续探索
        </span>
        <ChevronDown className="h-4 w-4 animate-bounce opacity-70" strokeWidth={1} />
      </motion.div>
    </section>
  )
}

function AmbientSoundToggle({ ambientTrack }: { ambientTrack?: string }) {
  const [enabled, setEnabled] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.28
    if (enabled) {
      const playPromise = audio.play()
      if (playPromise) {
        playPromise.catch(() => {
          setEnabled(false)
        })
      }
    } else {
      audio.pause()
      audio.currentTime = 0
    }

    return () => {
      audio.pause()
    }
  }, [enabled])

  if (!ambientTrack) {
    return null
  }

  return (
    <div className="pointer-events-auto absolute right-8 top-20 z-20">
      <button
        type="button"
        aria-label={enabled ? '关闭环境音' : '开启环境音'}
        aria-pressed={enabled}
        onClick={() => setEnabled((prev) => !prev)}
        className={cn(
          'group flex items-center gap-3 rounded-full border border-white/15 bg-black/20 px-5 py-3 text-sm font-light text-white shadow-2xl backdrop-blur-xl transition-all duration-300',
          enabled
            ? 'border-white/25 bg-white/10 text-white shadow-amber-500/10'
            : 'hover:border-white/25 hover:bg-white/10 hover:scale-105'
        )}
        style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
      >
        {enabled ? (
          <Volume2 className="h-4 w-4 text-amber-300 transition-colors" />
        ) : (
          <VolumeX className="h-4 w-4 transition-colors group-hover:text-white/90" />
        )}
        <span className="text-xs font-light tracking-[0.3em] uppercase transition-colors">
          环境音
        </span>
      </button>
      <audio ref={audioRef} loop preload="auto" src={ambientTrack} />
    </div>
  )
}

interface DynamicThemeToggleProps {
  isActive: boolean
  isLoading: boolean
  onToggle: () => void
  palette: any
}

function DynamicThemeToggle({ isActive, isLoading, onToggle, palette }: DynamicThemeToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!palette && !isActive) {
    return null
  }

  return (
    <div className="pointer-events-auto absolute right-8 top-8 z-20">
      <motion.button
        type="button"
        aria-label={isActive ? '关闭动态主题' : '开启动态主题'}
        aria-pressed={isActive}
        onClick={onToggle}
        disabled={isLoading}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        className={cn(
          'group flex items-center gap-3 rounded-full border border-white/15 bg-black/20 px-5 py-3 text-sm font-light text-white shadow-2xl backdrop-blur-xl transition-all duration-300',
          isActive
            ? 'border-white/30 bg-white/15 text-white shadow-amber-500/20'
            : 'hover:border-white/25 hover:bg-white/10 hover:scale-105',
          isLoading && 'opacity-60 cursor-not-allowed'
        )}
        style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
        whileHover={{ scale: isLoading ? 1 : 1.05 }}
        whileTap={{ scale: isLoading ? 1 : 0.95 }}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white/70" />
        ) : isActive ? (
          <Sparkles className="h-4 w-4 text-amber-300 transition-colors" />
        ) : (
          <Palette className="h-4 w-4 transition-colors group-hover:text-white/90" />
        )}
        <span className="text-xs font-light tracking-[0.3em] uppercase transition-colors">
          {isLoading ? '分析中' : isActive ? '动态主题' : '自适应色彩'}
        </span>
      </motion.button>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{
          opacity: showTooltip ? 1 : 0,
          y: showTooltip ? 0 : 10,
          scale: showTooltip ? 1 : 0.95
        }}
        transition={{ duration: 0.2 }}
        className="absolute top-full right-0 mt-3 w-64 rounded-2xl border border-white/20 bg-black/80 p-4 text-xs backdrop-blur-xl"
        style={{
          pointerEvents: showTooltip ? 'auto' : 'none',
          fontFamily: 'var(--token-typography-sans-font-family)'
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/90">
            <Sparkles className="h-3 w-3" />
            <span className="font-medium">智能配色系统</span>
          </div>
          <p className="text-white/70 leading-relaxed">
            {isActive
              ? '页面配色已根据首图自动调整，营造和谐的视觉体验。'
              : '点击启用基于首页大图的智能配色，让网站色调与作品完美融合。'}
          </p>
          {palette && !isActive && (
            <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-white/10">
              <div
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: `hsl(${palette.dominant})` }}
              />
              <div
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: `hsl(${palette.accent})` }}
              />
              <span className="text-white/60 text-[10px] uppercase tracking-wider">预览色彩</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
