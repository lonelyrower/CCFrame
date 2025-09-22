import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import type { LandingTagHighlight } from '@/lib/landing-data'

interface LandingMoodboardProps {
  tags: LandingTagHighlight[]
}

export function LandingMoodboard({ tags }: LandingMoodboardProps) {
  return (
    <section>
      <Container size="xl" bleed="none" className="py-16">
        <AnimateOnScroll>
          <Surface tone="glass" padding="lg" className="overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-panel/60 to-surface-canvas">
            <div className="space-y-6">
              <div className="max-w-2xl space-y-3">
                <Heading size="lg" className="text-balance text-white">
                  Moodboard 色彩情绪板
                </Heading>
                <Text tone="inverted" size="sm">
                  从大量素材中提炼出的热门主题与色彩，帮助你快速定位灵感方向。
                </Text>
              </div>
              {tags.length === 0 ? (
                <Text tone="inverted" size="sm">
                  当前没有可用的热门标签。上传并打标签后，这里会自动生成色彩情绪板。
                </Text>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {tags.map((tag, index) => (
                    <div
                      key={tag.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 text-white shadow-subtle backdrop-blur transition hover:-translate-y-1 hover:shadow-floating"
                      style={{ background: `linear-gradient(135deg, ${tag.color}33 0%, ${tag.color}66 100%)` }}
                    >
                      <div className="absolute right-4 top-4 text-xs uppercase tracking-wide text-white/70">#{index + 1}</div>
                      <Heading size="sm" className="text-white">
                        {tag.name}
                      </Heading>
                      <Text tone="inverted" size="sm" className="mt-2 text-white/80">
                        {tag.photoCount} 张作品
                      </Text>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Surface>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}
