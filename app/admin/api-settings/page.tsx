import { Container } from '@/components/layout/container'
import { Heading, Text } from '@/components/ui/typography'
import { Surface } from '@/components/ui/surface'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { fadeInScale } from '@/lib/motion/presets'
import { AlertCircle, Key, Webhook, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ApiSettingsPage() {
  return (
    <div className="pb-20 pt-6">
      <Container size="xl" bleed="none" className="flex flex-col gap-6">
        <AnimateOnScroll variants={fadeInScale}>
          <div className="space-y-2">
            <Heading size="lg">API 与集成</Heading>
            <Text tone="secondary">
              管理外部服务密钥、API 回调与验证设置。配置第三方集成和 Webhook。
            </Text>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll variants={fadeInScale} delay={0.08}>
          <Surface tone="panel" padding="lg" className="shadow-subtle">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <Heading size="sm" className="mb-2">功能开发中</Heading>
                <Text tone="secondary" size="sm" className="mb-4">
                  API 与集成管理功能正在开发中，将包括以下特性：
                </Text>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    外部 API 密钥管理（OpenAI、第三方存储等）
                  </li>
                  <li className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-primary" />
                    Webhook 配置与事件监听
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    API 访问控制与权限验证
                  </li>
                </ul>
              </div>
            </div>
          </Surface>
        </AnimateOnScroll>

        <AnimateOnScroll variants={fadeInScale} delay={0.12}>
          <Surface tone="canvas" padding="lg" className="border border-surface-outline/20">
            <Text size="xs" tone="muted" className="text-center">
              如需配置外部服务，请前往「运行时配置」页面进行设置。
            </Text>
          </Surface>
        </AnimateOnScroll>
      </Container>
    </div>
  )
}