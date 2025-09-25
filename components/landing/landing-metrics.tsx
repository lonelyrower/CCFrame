import { Sparkles, Camera, Bookmark, Tags } from 'lucide-react'

import type { LandingMetricsSnapshot } from '@/lib/landing-data'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { SemanticSearchPanel } from '@/components/gallery/semantic-search-panel'

interface LandingMetricsProps {
  metrics: LandingMetricsSnapshot
  semantic: {
    enabled: boolean
    mode: 'off' | 'shadow' | 'on'
  }
}

const formatter = new Intl.NumberFormat('zh-CN')

export function LandingMetrics({ metrics, semantic }: LandingMetricsProps) {
  const metricItems = [
    {
      id: 'photos',
      label: '作品总数',
      value: metrics.totalPhotos,
      description: '目前整理入册的照片',
      icon: Camera,
    },
    {
      id: 'recent',
      label: '最近 30 天',
      value: metrics.recentPhotosCount,
      description: '最近 30 天新加入的作品',
      icon: Sparkles,
    },
    {
      id: 'tags',
      label: '常用标签',
      value: metrics.totalTags,
      description: '常用标签，帮助我整理灵感',
      icon: Tags,
    },
    {
      id: 'albums',
      label: '精选系列',
      value: metrics.totalAlbums,
      description: '精选系列，用来串起故事线',
      icon: Bookmark,
    },
  ]

  return (
    <section id="experience">
      <Container size="xl" bleed="none" className="py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <AnimateOnScroll>
            <Surface padding="lg" className="h-full space-y-8">
              <div className="space-y-2">
                <Heading size="lg">作品速览</Heading>
                <Text tone="secondary">
                  用几组数字记录我最近的创作节奏，看看作品、标签与系列正在如何生长。
                </Text>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {metricItems.map(({ id, label, value, description, icon: Icon }) => (
                  <div
                    key={id}
                    className="group relative overflow-hidden rounded-2xl border border-surface-outline/40 bg-surface-panel/60 p-5 shadow-subtle transition hover:-translate-y-1 hover:shadow-floating"
                  >
                    <div className="absolute right-4 top-4 h-14 w-14 rounded-full bg-primary/10" aria-hidden />
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-semibold text-text-primary">{formatter.format(value)}</span>
                      <span className="text-sm text-text-muted">{label}</span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{description}</p>
                  </div>
                ))}
              </div>
            </Surface>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.08}>
            <Surface tone="glass" padding="lg" className="h-full">
              <div className="space-y-4">
                <Heading size="md">灵感词典</Heading>
                <Text tone="secondary" size="sm">
                  试着输入某种颜色或情绪，语义搜索会立刻把相册里与之呼应的作品找出来。
                </Text>
              </div>
              <div className="mt-6">
                <SemanticSearchPanel enabled={semantic.enabled} mode={semantic.mode} />
              </div>
            </Surface>
          </AnimateOnScroll>
        </div>
      </Container>
    </section>
  )
}
