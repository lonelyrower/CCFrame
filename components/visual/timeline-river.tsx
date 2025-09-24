import Image from 'next/image'
import Link from 'next/link'

import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { TimelineTooltip } from '@/components/visual/timeline-tooltip'
import type { TimelineEvent } from '@/types/timeline'
import { cn } from '@/lib/utils'

interface TimelineRiverProps {
  events: TimelineEvent[]
}

export function TimelineRiver({ events }: TimelineRiverProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-[32px] border border-contrast-outline/10 bg-contrast-surface/40 p-16 text-center text-text-inverted/70">
        <p className="text-sm uppercase tracking-[0.4em]">暂无可显示的时间线事件</p>
        <p className="mt-3 text-base text-text-inverted/60">调整筛选条件或稍后再试。</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute left-[calc(50%_-_1px)] top-0 hidden h-full w-0.5 bg-gradient-to-b from-white/60 via-white/10 to-transparent md:block"
        aria-hidden="true"
      />
      <div className="space-y-12 md:space-y-20">
        {events.map((event, index) => (
          <TimelineNode key={event.id} event={event} align={index % 2 === 0 ? 'left' : 'right'} />
        ))}
      </div>
    </div>
  )
}

function TimelineNode({ event, align }: { event: TimelineEvent; align: 'left' | 'right' }) {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] md:gap-10">
      <div className={cn('md:col-span-1', align === 'left' ? 'md:order-1' : 'md:order-3')}>
        <AnimateOnScroll>
          <EventCard event={event} align={align} />
        </AnimateOnScroll>
      </div>

      <AxisColumn event={event} align={align} />

      <div className={cn('hidden md:col-span-1 md:block', align === 'left' ? 'md:order-3' : 'md:order-1')} aria-hidden="true" />
    </div>
  )
}

function AxisColumn({ event, align }: { event: TimelineEvent; align: 'left' | 'right' }) {
  const label = event.timelineLabel ?? formatYearSegment(event.timestamp)
  return (
    <div className="relative flex items-center justify-center md:order-2">
      <div className="relative hidden h-full w-px md:flex md:justify-center" aria-hidden="true">
        <div className="absolute top-0 h-full w-px bg-gradient-to-b from-white/40 via-white/15 to-transparent" />
        <span
          className="relative z-10 mt-6 flex h-8 w-8 items-center justify-center rounded-full border border-contrast-outline/20 bg-surface-panel/90 text-xs font-semibold tracking-[0.2em] text-text-primary shadow-surface"
        >
          {new Date(event.timestamp).getDate()}
        </span>
      </div>
      <div className="md:absolute md:-top-12">
        <TimelineTooltip label={label} description={event.location} align={align} accentColor={event.highlightColor} />
      </div>
    </div>
  )
}

function EventCard({ event, align }: { event: TimelineEvent; align: 'left' | 'right' }) {
  const formattedDate = formatFullDate(event.timestamp)
  const personas = event.personas
  const secondaryPhotos = event.photos.slice(1, 4)

  return (
    <article
      className="relative overflow-hidden rounded-[32px] border border-contrast-outline/10 bg-contrast-surface/50 p-6 text-text-inverted shadow-floating backdrop-blur-xl transition-transform duration-500 md:p-8"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40" aria-hidden="true" />
      <div className="relative space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-contrast-outline/15 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-text-inverted/60">
              {formattedDate}
            </span>
            {personas.map((persona) => (
              <span
                key={persona.id}
                className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-text-inverted/70"
                style={persona.accentColor ? { borderColor: persona.accentColor, color: persona.accentColor } : undefined}
              >
                {persona.name}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-2xl leading-tight md:text-3xl">{event.title}</h3>
            {event.subtitle ? <p className="text-sm text-text-inverted/60">{event.subtitle}</p> : null}
          </div>
        </header>

        {event.primaryPhoto ? (
          <div className="relative overflow-hidden rounded-3xl border border-contrast-outline/10">
            <Image
              src={event.primaryPhoto.src}
              alt={event.primaryPhoto.alt ?? event.title}
              width={event.primaryPhoto.width ?? 1280}
              height={event.primaryPhoto.height ?? 720}
              className="h-full w-full object-cover"
              sizes="(max-width: 768px) 100vw, 540px"
            />
          </div>
        ) : null}

        {event.description ? (
          <p className="text-sm leading-relaxed text-text-inverted/75">{event.description}</p>
        ) : null}

        {secondaryPhotos.length ? (
          <div className="grid grid-cols-3 gap-3">
            {secondaryPhotos.map((photo) => (
              <div key={photo.id} className="relative overflow-hidden rounded-2xl border border-contrast-outline/10">
                <Image
                  src={photo.src}
                  alt={photo.alt ?? event.title}
                  width={photo.width ?? 640}
                  height={photo.height ?? 640}
                  className="h-full w-full object-cover"
                  sizes="(max-width: 768px) 33vw, 160px"
                />
              </div>
            ))}
          </div>
        ) : null}

        {event.metrics?.length ? (
          <div className="flex flex-wrap gap-3">
            {event.metrics.map((metric) => (
              <div key={metric.label} className="rounded-full border border-contrast-outline/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-text-inverted/60">
                <span className="text-text-inverted/40">{metric.label}</span>
                <span className="ml-2 text-text-inverted">{metric.value}</span>
              </div>
            ))}
          </div>
        ) : null}

        {event.tags.length ? (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-text-inverted/60"
                style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        ) : null}

        {event.links?.length ? (
          <div className="flex flex-wrap gap-3">
            {event.links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                target={link.target ?? '_self'}
                className="inline-flex items-center gap-2 rounded-full border border-contrast-outline/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-text-inverted/70 transition hover:text-text-inverted focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}

function formatFullDate(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatYearSegment(timestamp: string) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.toLocaleDateString('zh-CN', { month: 'short' })
  return `${year} · ${month}`
}
