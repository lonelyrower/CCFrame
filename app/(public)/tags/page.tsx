import { Suspense } from 'react'
import type { Metadata } from 'next'
import { motion } from 'framer-motion'
import { Tag as TagIcon, Hash, ArrowRight, Sparkles, Globe } from 'lucide-react'

import { TagOrbit } from '@/components/visual/tag-orbit'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'

interface TagsPageProps {
  searchParams?: Record<string, string | string[] | undefined>
}

export const metadata: Metadata = {
  title: '标签宇宙 · CC Frame',
  description: '通过交互式标签宇宙探索作品间的关联关系，发现色彩、情绪与主题的隐藏连接。',
}

export const revalidate = 300

function TagsLoading() {
  return (
    <div className="space-y-12 pb-32">
      <TagUniverseIntro />

      {/* Loading state for Tag Orbit */}
      <div className="relative min-h-[600px] overflow-hidden rounded-[48px] border border-white/10 bg-black/20 p-8 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-slate-900/20" />
        <div className="flex items-center justify-center h-full">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-2 border-white/10 border-t-amber-200/60" />
            <h3 className="text-xl font-light text-white/80" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>
              正在构建标签宇宙
            </h3>
            <p className="text-white/60 font-light max-w-md">
              正在分析作品间的关联关系与主题网络...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TagUniverseIntro() {
  return (
    <AnimateOnScroll>
      <section className="relative overflow-hidden rounded-[48px] border border-white/10 bg-gradient-to-br from-black/90 via-slate-900/80 to-black/95 p-8 text-white shadow-2xl backdrop-blur-lg md:p-12">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/3 via-transparent to-slate-900/10" />
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px'
            }}
          />
        </div>

        <div className="relative grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-end">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-amber-200/80" />
              <p className="text-xs font-light uppercase tracking-[0.3em] text-white/60">Tag Universe</p>
            </div>
            <h1
              className="text-4xl font-light leading-[1.15] tracking-tight md:text-5xl"
              style={{ fontFamily: 'var(--token-typography-display-font-family)' }}
            >
              标签宇宙
            </h1>
            <p className="max-w-2xl text-base font-light leading-relaxed text-white/75">
              每个标签都是一颗恒星，它们因共同的主题与情感而相互连接。
              在这个可交互的宇宙中，发现作品间隐藏的关联与创意的网络。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center text-white/80 sm:grid-cols-4 md:grid-cols-2">
            <StatBlock label="标签节点" iconComponent={Hash} />
            <StatBlock label="关联连接" iconComponent={Sparkles} />
          </div>
        </div>
      </section>
    </AnimateOnScroll>
  )
}

function StatBlock({
  label,
  value,
  iconComponent: IconComponent
}: {
  label: string
  value?: number
  iconComponent: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-6">
      <div className="flex flex-col items-center space-y-2">
        <IconComponent className="h-5 w-5 text-amber-200/60" />
        <p className="text-xs font-light uppercase tracking-[0.25em] text-white/50">{label}</p>
        {value !== undefined && (
          <p className="text-xl font-light">{Intl.NumberFormat('zh-CN').format(value)}</p>
        )}
      </div>
    </div>
  )
}

function TagsContent({ searchParams }: TagsPageProps) {
  // Mock data for now to avoid SSR issues
  const nodes: any[] = []
  const edges: any[] = []
  const stats = {
    totalTags: 0,
    totalEdges: 0,
    maxFrequency: 0
  }
  const filter = { focusTagId: null }

  return (
    <div className="space-y-12 pb-32">
      <TagUniverseIntro />

      <AnimateOnScroll delay={0.2}>
        <div className="space-y-6">
          {/* Enhanced Tag Universe Visualization */}
          <TagOrbit nodes={nodes} edges={edges} className="min-h-[700px]" />

          {/* Stats and Controls */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="标签节点"
              value={stats.totalTags}
              description="作品主题分类"
              iconComponent={TagIcon}
            />
            <StatCard
              label="关联连接"
              value={stats.totalEdges}
              description="标签间关系"
              iconComponent={Sparkles}
            />
            <StatCard
              label="最高频次"
              value={stats.maxFrequency}
              description="最常用标签"
              iconComponent={Hash}
            />
            <StatCard
              label="视图模式"
              value={filter.focusTagId ? 1 : 0}
              description={filter.focusTagId ? "焦点模式" : "全景模式"}
              iconComponent={Globe}
              isToggle
            />
          </div>
        </div>
      </AnimateOnScroll>
    </div>
  )
}

function StatCard({
  label,
  value,
  description,
  iconComponent: IconComponent,
  isToggle = false
}: {
  label: string
  value: number
  description: string
  iconComponent: React.ComponentType<{ className?: string }>
  isToggle?: boolean
}) {
  return (
    <motion.div
      className="rounded-[24px] border border-white/10 bg-black/40 p-6 backdrop-blur-xl"
      whileHover={{ scale: 1.02, borderColor: 'rgba(251, 191, 36, 0.3)' }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <IconComponent className="h-5 w-5 text-amber-200/70" />
          {!isToggle && (
            <span className="text-2xl font-light text-white">
              {Intl.NumberFormat('zh-CN').format(value)}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-white/90">{label}</h3>
          <p className="text-xs font-light text-white/60">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function TagsPage({ searchParams }: TagsPageProps) {
  return (
    <Suspense fallback={<TagsLoading />}>
      <TagsContent searchParams={searchParams} />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
export const runtime = 'edge'
