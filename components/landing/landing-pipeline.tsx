import { Activity, Loader2, UploadCloud, CheckCircle2, AlertOctagon } from 'lucide-react'

import type { LandingPipelineSnapshot } from '@/lib/landing-data'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'

interface LandingPipelineProps {
  pipeline: LandingPipelineSnapshot
}

const STATUS_META = {
  UPLOADING: {
    icon: UploadCloud,
    label: '正在导入',
    description: '原片刚从相机传来，正在备份与检查。',
    accent: 'bg-sky-500/15 text-sky-500',
    barColor: 'bg-sky-400/80',
    dotColor: 'bg-sky-500',
  },
  PROCESSING: {
    icon: Loader2,
    label: '整理中',
    description: '挑选、去重并写下拍摄时的记忆与标签。',
    accent: 'bg-amber-500/15 text-amber-500',
    barColor: 'bg-amber-400/80',
    dotColor: 'bg-amber-500',
  },
  COMPLETED: {
    icon: CheckCircle2,
    label: '已公开',
    description: '作品已经出现在相册与精选系列中。',
    accent: 'bg-emerald-500/15 text-emerald-500',
    barColor: 'bg-emerald-500/80',
    dotColor: 'bg-emerald-500',
  },
  FAILED: {
    icon: AlertOctagon,
    label: '待关注',
    description: '偶尔会有导入失败或需要手动修复的片段。',
    accent: 'bg-rose-500/15 text-rose-500',
    barColor: 'bg-rose-500/70',
    dotColor: 'bg-rose-500',
  },
} as const

const STATUS_ORDER: Array<keyof typeof STATUS_META> = [
  'UPLOADING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]

export function LandingPipeline({ pipeline }: LandingPipelineProps) {
  const total = Object.values(pipeline.totals).reduce((sum, value) => sum + value, 0)
  const completed = pipeline.totals.COMPLETED || 0
  const completion = total > 0 ? Math.round((completed / total) * 100) : 0
  const hasData = total > 0

  const cumulativeLeft: Record<string, number> = {}
  if (hasData) {
    let cursor = 0
    for (const key of STATUS_ORDER) {
      const value = pipeline.totals[key] ?? 0
      cumulativeLeft[key] = cursor
      cursor += total > 0 ? (value / total) * 100 : 0
    }
  }

  return (
    <section>
      <Container size="xl" bleed="none" className="py-16">
        <AnimateOnScroll>
          <Surface padding="lg" className="space-y-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <Heading size="lg">创作进度</Heading>
                <Text tone="secondary" size="sm">从导入、整理到上架展示，记录作品背后的整理流程。</Text>
              </div>
              <div className="rounded-full bg-surface-panel px-4 py-2 text-sm text-text-secondary">
                <Activity className="mr-2 inline h-4 w-4 text-primary" /> 待整理作品 {pipeline.totalActive}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>整理完成度</span>
                <span>{completion}%</span>
              </div>
              <div className="space-y-2">
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-outline/40">
                  {!hasData ? (
                    <span className="absolute inset-0 rounded-full bg-surface-outline/50" />
                  ) : (
                    STATUS_ORDER.map((statusKey) => {
                      const meta = STATUS_META[statusKey]
                      const value = pipeline.totals[statusKey] ?? 0
                      if (value === 0) return null
                      const width = Math.max((value / total) * 100, 1.5)
                      return (
                        <span
                          key={statusKey}
                          className={'absolute inset-y-0 ' + meta.barColor}
                          style={{
                            width: `${width}%`,
                            left: `${cumulativeLeft[statusKey]}%`,
                          }}
                        />
                      )
                    })
                  )}
                </div>
                {hasData ? (
                  <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                    {STATUS_ORDER.map((statusKey) => {
                      const meta = STATUS_META[statusKey]
                      const value = pipeline.totals[statusKey] ?? 0
                      if (value === 0) return null
                      const percent = Math.round((value / total) * 100)
                      return (
                        <span key={statusKey} className="flex items-center gap-1">
                          <span className={'h-2.5 w-2.5 rounded-full ' + meta.dotColor} />
                          {meta.label} · {percent}%
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <Text tone="secondary" size="xs">暂时没有统计数据，等下一批作品导入后再来看看。</Text>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {STATUS_ORDER.map((statusKey) => {
                const meta = STATUS_META[statusKey]
                const value = pipeline.totals[statusKey] ?? 0
                const Icon = meta.icon
                return (
                  <div
                    key={statusKey}
                    className="flex items-start gap-4 rounded-2xl border border-surface-outline/40 bg-surface-panel/70 p-5"
                  >
                    <span className={'flex h-10 w-10 items-center justify-center rounded-xl ' + meta.accent}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <Heading size="xs">{meta.label}</Heading>
                        <span className="text-sm text-text-muted">{value}</span>
                      </div>
                      <Text tone="secondary" size="xs">
                        {meta.description}
                      </Text>
                    </div>
                  </div>
                )
              })}
            </div>
          </Surface>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}
