import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/layout/container'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import type { LandingActivityItem } from '@/lib/landing-data'
import { getImageUrl } from '@/lib/utils'
import type { PhotoWithDetails } from '@/types'

interface HomeLatestProps {
  photos: PhotoWithDetails[]
  activity: LandingActivityItem[]
}

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

type StatusMeta = {
  label: string
  tone: string
  description: string
}

function getStatusMeta(status: string): StatusMeta {
  const normalized = status.toLowerCase()
  if (normalized === 'uploading') {
    return {
      label: '上传中',
      tone: 'text-amber-300',
      description: '新的故事正在进入画廊',
    }
  }
  if (normalized === 'processing') {
    return {
      label: '冲洗中',
      tone: 'text-sky-300',
      description: '等待光影慢慢显影',
    }
  }
  if (normalized === 'failed') {
    return {
      label: '处理中断',
      tone: 'text-rose-300',
      description: '我们会尽快修复这个瞬间',
    }
  }
  return {
    label: '已入展',
    tone: 'text-emerald-300',
    description: '作品已加入线上展览',
  }
}

export function HomeLatest({ photos, activity }: HomeLatestProps) {
  const photoMap = new Map(photos.map((photo) => [photo.id, photo]))

  return (
    <section className="relative isolate overflow-hidden py-32 sm:py-40" id="latest">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/20 to-black/60" aria-hidden />
      <div className="absolute inset-0 -z-10 opacity-15" style={{ background: 'var(--token-gradient-glow-secondary)' }} />
      <Container className="space-y-16">
        <AnimateOnScroll>
          <div className="flex flex-col gap-8 text-white sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-6">
              <p className="text-sm font-light uppercase tracking-[0.5em] text-white/45" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                最新创作日志
              </p>
              <h2 className="text-4xl font-light leading-tight sm:text-6xl" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>
                实时动态，<br className="hidden sm:block" />见证创作的脉搏
              </h2>
              <p className="max-w-3xl text-lg font-light leading-relaxed text-white/65 narrative-text" style={{ fontFamily: 'var(--token-typography-narrative-font-family)' }}>
                每一次上传与显影，都是创作旅程的呼吸节奏。在这里，你可以感受到最新的灵感火花、拍摄瞬间与发布时刻的真实轨迹。
              </p>
            </div>
            <Link
              href="/photos"
              className="group inline-flex items-center gap-3 self-start rounded-full border border-white/15 bg-transparent px-8 py-4 text-base font-light text-white/75 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-white/10 hover:text-white hover:scale-[1.02]"
              style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
            >
              浏览最新作品
              <span className="text-white/50 transition-colors group-hover:text-white/80">→</span>
            </Link>
          </div>
        </AnimateOnScroll>

        <div className="grid gap-8 lg:grid-cols-3">
          {activity.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-white/10 p-16 text-center">
              <p className="text-lg font-light text-white/50 narrative-text" style={{ fontFamily: 'var(--token-typography-narrative-font-family)' }}>
                正在准备新的故事片段，敬请期待这些即将到来的光影瞬间。
              </p>
            </div>
          )}

          {activity.map((item) => {
            const meta = getStatusMeta(item.status)
            const preview = photoMap.get(item.id)

            return (
              <AnimateOnScroll key={`activity-${item.id}`}>
                <article className="group relative h-full overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02] p-8 text-white shadow-[0_32px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all duration-500 hover:border-white/15 hover:bg-white/[0.04] hover:scale-[1.02] hover:shadow-[0_40px_100px_rgba(212,163,115,0.06)]">
                  <div className="relative h-52 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] shadow-xl">
                    {preview ? (
                      <Image
                        src={getImageUrl(preview.id, 'medium', 'webp')}
                        alt={preview.title || '最新作品'}
                        fill
                        sizes="400px"
                        className="object-cover saturate-[1.05] transition-all duration-700 group-hover:saturate-[1.1] group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/8 via-white/3 to-white/8">
                        <span className="text-sm font-light text-white/50" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                          正在显影中
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>

                  <div className="mt-8 space-y-6">
                    <div className="space-y-3">
                      <p className={`text-sm font-light ${meta.tone}`} style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                        {meta.label}
                      </p>
                      <p className="text-base font-light text-white/75 narrative-text" style={{ fontFamily: 'var(--token-typography-narrative-font-family)' }}>
                        {meta.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-light" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                      <span className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-white/60">
                        {timeFormatter.format(item.createdAt)}
                      </span>
                      {item.album?.title && (
                        <span className="rounded-full border border-white/8 bg-white/[0.02] px-4 py-2 text-white/55">
                          专辑 · {item.album.title}
                        </span>
                      )}
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-1.5 text-xs font-light text-white/55"
                            style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link
                      href="/photos"
                      aria-label="在作品集中查看最新作品"
                      className="group inline-flex items-center gap-2 text-sm font-light text-white/60 transition-colors hover:text-white/90"
                      style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
                    >
                      在作品集中查看
                      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                    </Link>
                  </div>
                </article>
              </AnimateOnScroll>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
