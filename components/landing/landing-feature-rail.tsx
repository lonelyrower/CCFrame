import { Camera, Sparkles, Layers, Share2, Workflow, Wand2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Container } from '@/components/layout/container'
import { ContentRail } from '@/components/layout/content-rail'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'

interface FeatureItem {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

const FEATURES: FeatureItem[] = [
  {
    id: 'city-walks',
    title: '城市漫游',
    description: '在夜色与清晨之间追逐霓虹与倒影，让熟悉的城市成为故事背景。',
    icon: Sparkles,
  },
  {
    id: 'portraits',
    title: '亲密肖像',
    description: '记录家人和朋友的神情，把相处时的温度和信任留在照片里。',
    icon: Camera,
  },
  {
    id: 'seasons',
    title: '四季色调',
    description: '用不同的色彩主题整理春夏秋冬的光线变化。',
    icon: Layers,
  },
  {
    id: 'journeys',
    title: '旅途记忆',
    description: '旅途中随写的影像日记，每一站都是新的灵感和注脚。',
    icon: Workflow,
  },
  {
    id: 'notes',
    title: '创作随笔',
    description: '每个系列都有文字旁白，记录拍摄当下的心绪与灵感来源。',
    icon: Wand2,
  },
  {
    id: 'sharing',
    title: '开放分享',
    description: '把整理好的作品册分享给朋友，也欢迎你留言交流心得。',
    icon: Share2,
  },
]

export function LandingFeatureRail() {
  return (
    <section>
      <Container size="xl" bleed="none" className="py-12">
        <div className="space-y-6">
          <AnimateOnScroll>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Heading size="lg">创作亮点</Heading>
                <Text tone="secondary">
                  挑选几件最近让我着迷的主题，带你快速认识这些作品。
                </Text>
              </div>
            </div>
          </AnimateOnScroll>

          <ContentRail fadeEdges>
            {FEATURES.map(({ id, title, description, icon: Icon }, index) => (
              <AnimateOnScroll key={id} delay={index * 0.05}>
                <Surface
                  tone="panel"
                  padding="lg"
                  className="min-h-[220px] min-w-[240px] max-w-[260px] border border-surface-outline/40 bg-surface-panel/80 shadow-subtle"
                >
                  <div className="flex h-full flex-col gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <Heading size="sm">{title}</Heading>
                    <Text size="sm" tone="secondary" className="leading-relaxed text-pretty">
                      {description}
                    </Text>
                  </div>
                </Surface>
              </AnimateOnScroll>
            ))}
          </ContentRail>
        </div>
      </Container>
    </section>
  )
}
