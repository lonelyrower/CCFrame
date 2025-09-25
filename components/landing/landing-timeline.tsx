import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import type { LandingActivityItem } from '@/lib/landing-data'

interface LandingTimelineProps {
  activity: LandingActivityItem[]
}

const relativeFormatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatRelative(date: Date) {
  const now = Date.now()
  const diff = date.getTime() - now
  const minutes = Math.round(diff / 60000)
  const hours = Math.round(diff / 3600000)
  const days = Math.round(diff / 86400000)

  if (Math.abs(minutes) < 60) return relativeFormatter.format(minutes, 'minute')
  if (Math.abs(hours) < 48) return relativeFormatter.format(hours, 'hour')
  return relativeFormatter.format(days, 'day')
}

export function LandingTimeline({ activity }: LandingTimelineProps) {
  return (
    <section>
      <Container size="xl" bleed="none" className="py-16">
        <AnimateOnScroll>
          <Surface padding="lg" className="space-y-6">
            <div className="space-y-2">
              <Heading size="lg">最新创作记录</Heading>
              <Text tone="secondary" size="sm">
                按时间排列最近的作品更新、系列上线与灵感片段。
              </Text>
            </div>

            {activity.length === 0 ? (
              <Text tone="secondary" size="sm">
                暂时还没有新的动态，等我整理完最新的照片再来看看吧。
              </Text>
            ) : (
              <ol className="relative space-y-5 border-l border-surface-outline/40 pl-6">
                {activity.map((item) => (
                  <li key={item.id} className="relative">
                    <span className="absolute -left-[11px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <span>{formatRelative(new Date(item.createdAt))}</span>
                      <span>·</span>
                      <span>{dateFormatter.format(new Date(item.createdAt))}</span>
                    </div>
                    <Heading size="xs" className="mt-1">
                      {item.album?.title || '未归档系列'}
                    </Heading>
                    <Text tone="secondary" size="sm" className="mt-1">
                      进度：{item.status}
                    </Text>
                    {item.tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={{ background: `${tag.color}1a`, color: tag.color }}
                          >
                            #{tag.name}
                          </span>
                        ))}
                        {item.tags.length > 4 ? (
                          <span className="rounded-full bg-surface-outline/30 px-3 py-1 text-text-muted">
                            +{item.tags.length - 4}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </Surface>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}
