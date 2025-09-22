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
      label: '公开作品',
      value: metrics.totalPhotos,
      description: '已经完成处理的公开照片',
      icon: Camera,
    },
    {
      id: 'recent',
      label: '近 30 日新增',
      value: metrics.recentPhotosCount,
      description: '创作者持续上传的最新灵感',
      icon: Sparkles,
    },
    {
      id: 'tags',
      label: '主题标签',
      value: metrics.totalTags,
      description: '语义理解与色彩聚类的结合',
      icon: Tags,
    },
    {
      id: 'albums',
      label: '精选相册',
      value: metrics.totalAlbums,
      description: '按故事线串联的沉浸式合集',
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
                <Heading size="lg">数据驱动的摄影中台</Heading>
                <Text tone="secondary">
                  从自动归档、语义检索到智能故事线，CC Frame 的数据底座时刻准备就绪。
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
                <Heading size="md">语义搜索实验室</Heading>
                <Text tone="secondary" size="sm">
                  通过嵌入向量理解照片含义，以自然语言检索特定场景、情绪或色调。实时演示由实验模式驱动。
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
