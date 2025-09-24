import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TagLegend } from '@/components/visual/tag-legend'
import { TagOrbit } from '@/components/visual/tag-orbit'
import { featureFlags } from '@/lib/config/feature-flags'
import { getTagUniverse } from '@/lib/tags/tag-graph-service'

export const metadata: Metadata = {
  title: '标签宇宙 · CC Frame',
  description: '通过可视化标签关系网络，发现摄影主题之间的情绪共鸣与造型关联。',
}

export const revalidate = 180

export default async function TagUniversePage() {
  if (!featureFlags.enableTagUniverse) {
    notFound()
  }

  const view = await getTagUniverse('radial')

  return (
    <div className="space-y-12 pb-32">
      <TagUniverseHero stats={view.stats} generatedAt={view.generatedAt} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,0.9fr)]">
        <TagOrbit nodes={view.nodes} edges={view.edges} className="h-[640px]" />
        <div className="space-y-6">
          <TagLegend nodes={view.nodes} />
          <TagUniverseNotes />
        </div>
      </div>
    </div>
  )
}

function TagUniverseHero({ stats, generatedAt }: { stats: { totalTags: number; totalEdges: number; maxFrequency: number }; generatedAt: string }) {
  return (
    <section className="relative overflow-hidden rounded-[48px] border border-contrast-outline/10 bg-gradient-to-br from-[#0f1a2e] via-[#121027] to-[#080914] p-8 text-text-inverted shadow-floating backdrop-blur-lg md:p-12">
      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-end">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.45em] text-text-inverted/50">Tag Universe</p>
          <h1 className="font-serif text-3xl leading-tight md:text-4xl">标签宇宙</h1>
          <p className="max-w-2xl text-base leading-relaxed text-text-inverted/70">
            以力导向与同心布局为基础，将主题标签的共现关系转化为可探索的星图。点击标签即可跳转至对应的作品集合，继续深入探索关联故事。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-text-inverted/80">
          <Stat label="标签" value={stats.totalTags} />
          <Stat label="连结" value={stats.totalEdges} />
          <Stat label="最高热度" value={stats.maxFrequency} />
        </div>
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.35em] text-text-inverted/40">UPDATED {new Date(generatedAt).toLocaleDateString('zh-CN')}</p>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-contrast-outline/15 bg-surface-panel/5 px-4 py-6">
      <p className="text-xs uppercase tracking-[0.4em] text-text-inverted/40">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{Intl.NumberFormat('zh-CN').format(value)}</p>
    </div>
  )
}

function TagUniverseNotes() {
  return (
    <section className="rounded-[32px] border border-contrast-outline/10 bg-contrast-surface/20 p-6 text-text-inverted/70 backdrop-blur-lg">
      <p className="text-xs uppercase tracking-[0.35em] text-text-inverted/40">探索提示</p>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed">
        <li>• 点击节点即可筛选目录，并跳转至对应标签合集</li>
        <li>• 较大的节点代表出现频次更高的核心标签</li>
        <li>• 连线越亮，说明标签之间的共现强度越高</li>
      </ul>
    </section>
  )
}

