import type { Metadata } from 'next'

import { TimelineFilterBar } from '@/components/visual/timeline-filter-bar'
import { TimelineRiver } from '@/components/visual/timeline-river'
import { parseTimelineFilters } from '@/lib/timeline/filters'
import { getTimelineQuery } from '@/lib/timeline/timeline-service'

interface TimelinePageProps {
  searchParams?: Record<string, string | string[] | undefined>
}

export const metadata: Metadata = {
  title: '时间线 · CC Frame',
  description: '按照年份、人物与标签探索作品的演变轨迹，发现每一次造型背后的故事节点。',
}

export const revalidate = 180

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const filters = parseTimelineFilters(searchParams)
  const result = await getTimelineQuery(filters)
  const { events, stats, filters: filterContext } = result

  return (
    <div className="space-y-12 pb-32">
      <TimelineIntro stats={stats} />
      <TimelineFilterBar options={filterContext.options} active={filterContext.active} availableYears={filterContext.availableYears} />
      <TimelineRiver events={events} />
    </div>
  )
}

function TimelineIntro({ stats }: { stats: { totalEvents: number; totalPhotos: number; distinctPersonas: number; distinctTags: number } }) {
  return (
    <section className="relative overflow-hidden rounded-[48px] border border-contrast-outline/10 bg-gradient-to-br from-[#101026]/90 via-[#0b0b1b]/80 to-[#05050d] p-8 text-text-inverted shadow-floating backdrop-blur-lg md:p-12">
      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-end">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.45em] text-text-inverted/50">Timeline</p>
          <h1 className="font-serif text-3xl leading-tight md:text-4xl">作品时间线</h1>
          <p className="max-w-2xl text-base leading-relaxed text-text-inverted/70">
            记录每一次造型实验、展览节点与幕后跨界合作。通过年份、人物与标签筛选，快速定位重要时刻，并可直接跳转至光箱或主题页继续浏览。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center text-text-inverted/80 sm:grid-cols-4">
          <StatBlock label="事件" value={stats.totalEvents} />
          <StatBlock label="作品" value={stats.totalPhotos} />
          <StatBlock label="人物/系列" value={stats.distinctPersonas} />
          <StatBlock label="标签" value={stats.distinctTags} />
        </div>
      </div>
    </section>
  )
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-contrast-outline/15 bg-surface-panel/5 px-4 py-6">
      <p className="text-xs uppercase tracking-[0.4em] text-text-inverted/40">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{Intl.NumberFormat('zh-CN').format(value)}</p>
    </div>
  )
}
