import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import type { LandingMetricsSnapshot } from '@/lib/landing-data'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'

interface LandingCTAProps {
  metrics: LandingMetricsSnapshot
}

const numberFormatter = new Intl.NumberFormat('zh-CN')

export function LandingCTA({ metrics }: LandingCTAProps) {
  return (
    <section>
      <Container size="lg" bleed="none" className="py-16">
        <AnimateOnScroll>
          <Surface tone="glass" padding="lg" className="flex flex-col items-start gap-6 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-surface-panel to-surface-canvas shadow-floating sm:flex-row sm:items-center sm:justify-between sm:gap-12">
            <div className="space-y-3 text-balance">
              <Heading size="lg" className="text-text-inverted">
                准备好构建你的下一场视觉叙事了吗？
              </Heading>
              <Text tone="inverted">
                目前我们已经托管了 {numberFormatter.format(metrics.totalPhotos)} 张作品，随时欢迎你上传、整理与分享新的灵感。
              </Text>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/photos">
                  即刻浏览
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/admin">登录后台</Link>
              </Button>
            </div>
          </Surface>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}
