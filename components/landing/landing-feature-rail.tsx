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
    id: 'semantic',
    title: '语义理解',
    description: '通过嵌入向量识别情绪、场景与构图，跨语言检索灵感。',
    icon: Sparkles,
  },
  {
    id: 'automation',
    title: '全自动归档',
    description: '批量处理上传、自动生成多种规格的图像变体并保留 EXIF。',
    icon: Wand2,
  },
  {
    id: 'storyline',
    title: '时序叙事',
    description: '以时间轴、故事集与动态相册呈现完整的创作旅程。',
    icon: Workflow,
  },
  {
    id: 'collaboration',
    title: '轻松分享',
    description: '面向客户的公共页面与可控权限，一键输出精选集。',
    icon: Share2,
  },
  {
    id: 'layers',
    title: '结构化管理',
    description: '标签、智能相册与高级筛选组合，快速定位素材。',
    icon: Layers,
  },
  {
    id: 'capture',
    title: '高保真影像',
    description: '自适应色彩管理、HDR、RAW 处理，保留作品细节与质感。',
    icon: Camera,
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
                <Heading size="lg">工作流亮点</Heading>
                <Text tone="secondary">
                  将创作过程中的采集、整理、交付串联成一体化体验。
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
