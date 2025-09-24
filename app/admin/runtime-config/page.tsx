import { Container } from '@/components/layout/container'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import RuntimeConfigPanel from '@/components/admin/runtime-config-panel'

export const dynamic = 'force-dynamic'

export default function RuntimeConfigPage() {
  return (
    <div className="pb-20 pt-6">
      <Container size="xl" bleed="none" className="flex flex-col gap-6">
        <AnimateOnScroll>
          <div className="space-y-2">
            <Heading size="lg">运行时配置</Heading>
            <Text tone="secondary">
            调整存储、CDN 和语义搜索提供商设置。保存后立即生效。
          </Text>
          </div>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.08}>
          <RuntimeConfigPanel />
        </AnimateOnScroll>
      </Container>
    </div>
  )
}
