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
                发现更多摄影时光
              </Heading>
              <Text tone="inverted">
                这里收录了 {numberFormatter.format(metrics.totalPhotos)} 张精选作品，每一张都承载着独特的瞬间与情感。
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
                <Link href="/timeline">时间足迹</Link>
              </Button>
            </div>
          </Surface>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}
