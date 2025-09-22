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
    label: '\u4e0a\u4f20\u4e2d',
    description: '\u6b63\u5728\u5199\u5165\u5b58\u50a8\u4e0e\u6821\u9a8c\u5b8c\u6574\u6027',
    accent: 'bg-sky-500/15 text-sky-500',
    barColor: 'bg-sky-400/80',
    dotColor: 'bg-sky-500',
  },
  PROCESSING: {
    icon: Loader2,
    label: '\u5904\u7406\u961f\u5217',
    description: '\u6267\u884c\u53bb\u91cd\u3001EXIF\u3001\u53d8\u4f53\u4ee5\u53ca AI \u6807\u6ce8',
    accent: 'bg-amber-500/15 text-amber-500',
    barColor: 'bg-amber-400/80',
    dotColor: 'bg-amber-500',
  },
  COMPLETED: {
    icon: CheckCircle2,
    label: '\u5df2\u5b8c\u6210',
    description: '\u53ef\u5728\u56fe\u5e93\u3001\u76f8\u518c\u4e0e\u6545\u4e8b\u4e2d\u5373\u523b\u6d4f\u89c8',
    accent: 'bg-emerald-500/15 text-emerald-500',
    barColor: 'bg-emerald-500/80',
    dotColor: 'bg-emerald-500',
  },
  FAILED: {
    icon: AlertOctagon,
    label: '\u5f02\u5e38',
    description: '\u81ea\u52a8\u91cd\u8bd5\u6216\u63d0\u793a\u4eba\u5de5\u4ecb\u5165',
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
                <Heading size="lg">\u5b9e\u65f6\u5904\u7406\u7ba1\u7ebf</Heading>
                <Text tone="secondary" size="sm">\u5c06\u6444\u5f71\u5e08\u7684\u4e0a\u4f20\u3001\u8f6c\u7801\u3001\u6807\u6ce8\u4e0e\u516c\u5f00\u53d1\u5e03\u4e32\u6210\u4e00\u6761\u81ea\u52a8\u5316\u6d41\u6c34\u7ebf</Text>
              </div>
              <div className="rounded-full bg-surface-panel px-4 py-2 text-sm text-text-secondary">
                <Activity className="mr-2 inline h-4 w-4 text-primary" /> \u6d3b\u8dc3\u4efb\u52a1 {pipeline.totalActive}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>\u5b8c\u6210\u5ea6</span>
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
                          {meta.label} \xb7 {percent}%
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <Text tone="secondary" size="xs">\u6682\u65e0\u7edf\u8ba1\u6570\u636e\uff0c\u7b49\u5f85\u9996\u6279\u4efb\u52a1\u8fd0\u884c\u3002</Text>
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
