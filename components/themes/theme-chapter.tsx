import Image from 'next/image'
import Link from 'next/link'

import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import type { ThemeChapter } from '@/types/themes'
import { cn } from '@/lib/utils'

interface ThemeChapterSectionProps {
  chapter: ThemeChapter
  index: number
}

export function ThemeChapterSection({ chapter, index }: ThemeChapterSectionProps) {
  const tone = chapter.surfaceTone === 'light' ? 'text-neutral-900' : 'text-text-inverted'
  const backgroundClass = chapter.surfaceTone === 'light' ? 'bg-surface-panel/80 text-neutral-900' : 'bg-contrast-surface/50 text-text-inverted'

  return (
    <section
      id={chapter.id}
      className={cn(
        'relative scroll-mt-24 rounded-[40px] border border-contrast-outline/10 p-6 shadow-floating md:p-12',
        backgroundClass,
      )}
    >
      {chapter.backgroundImage ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[38px]" aria-hidden="true">
          <Image src={chapter.backgroundImage} alt="" fill className="object-cover opacity-20" sizes="100vw" />
        </div>
      ) : null}
      <div className="relative z-10">
        <header className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-current opacity-60">{chapter.kicker ?? `Chapter ${index + 1}`}</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">{chapter.title}</h2>
            {chapter.subtitle ? <p className="mt-2 text-sm text-current/70">{chapter.subtitle}</p> : null}
          </div>
          {chapter.metrics?.length ? (
            <div className="flex flex-wrap gap-4">
              {chapter.metrics.map((metric) => (
                <span
                  key={metric.label}
                  className="flex min-w-[120px] flex-col rounded-full border border-current/10 bg-contrast-surface/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-current/80"
                >
                  <span className="text-[10px] text-current/60">{metric.label}</span>
                  <span className="text-sm font-semibold tracking-normal text-current">{metric.value}</span>
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-start">
          <div className="space-y-6 text-base leading-relaxed">
            {chapter.body?.map((paragraph, paragraphIndex) => (
              <AnimateOnScroll key={paragraphIndex}>
                <p className={cn('text-base leading-relaxed', tone === 'text-text-inverted' ? 'text-text-inverted/80' : 'text-neutral-800/80')}>
                  {paragraph}
                </p>
              </AnimateOnScroll>
            ))}
            {chapter.quote ? <QuoteBlock quote={chapter.quote} tone={tone} /> : null}
            {chapter.timeline ? <TimelineSnippet timeline={chapter.timeline} /> : null}
            {chapter.actions?.length ? <ActionRow actions={chapter.actions} accentColor={chapter.accentColor} /> : null}
          </div>
          <div className="grid gap-6">
            {chapter.media.map((asset) => (
              <MediaCard key={asset.id} asset={asset} tone={tone} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MediaCard({ asset, tone }: { asset: ThemeChapter['media'][number]; tone: string }) {
  const borderClass = tone === 'text-text-inverted' ? 'border-contrast-outline/20' : 'border-neutral-200'

  if (asset.type === 'image') {
    return (
      <div className={cn('relative overflow-hidden rounded-3xl border shadow-floating', borderClass)}>
        <Image src={asset.src} alt={asset.alt ?? ''} width={asset.width ?? 1200} height={asset.height ?? 1600} className="h-full w-full object-cover" />
      </div>
    )
  }

  if (asset.type === 'video') {
    return (
      <div className={cn('relative overflow-hidden rounded-3xl border shadow-floating', borderClass)}>
        <video
          className="h-full w-full object-cover"
          loop={asset.loop ?? true}
          autoPlay={asset.autoplay ?? true}
          muted
          playsInline
          poster={asset.poster ?? undefined}
        >
          <source src={asset.src} />
        </video>
      </div>
    )
  }

  return (
    <div className={cn('rounded-3xl border p-6 shadow-floating', borderClass)}>
      <audio className="w-full" controls src={asset.src} />
      <p className="mt-3 text-xs text-current/60">{asset.alt ?? 'Ambient'}</p>
    </div>
  )
}

function QuoteBlock({ quote, tone }: { quote: NonNullable<ThemeChapter['quote']>; tone: string }) {
  return (
    <blockquote
      className={cn(
        'rounded-3xl border-l-4 pl-6 text-lg italic',
        tone === 'text-text-inverted' ? 'border-contrast-outline/40 text-text-inverted/80' : 'border-neutral-400 text-neutral-700',
      )}
    >
      “{quote.text}”
      <footer className="mt-3 text-sm not-italic opacity-70">
        {quote.author}
        {quote.role ? <span className="ml-2">· {quote.role}</span> : null}
      </footer>
    </blockquote>
  )
}

function TimelineSnippet({ timeline }: { timeline: NonNullable<ThemeChapter['timeline']> }) {
  return (
    <div className="rounded-3xl border border-current/15 bg-contrast-surface/5 p-6 text-sm text-current/70">
      <p className="text-xs uppercase tracking-[0.4em] text-current/50">Timeline</p>
      <p className="mt-2 text-base font-semibold text-current">{timeline.year}</p>
      <p className="mt-1 leading-relaxed">{timeline.description}</p>
      {timeline.href ? (
        <Link href={timeline.href} className="mt-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-current/70">
          查看时间线
        </Link>
      ) : null}
    </div>
  )
}

function ActionRow({ actions, accentColor }: { actions: NonNullable<ThemeChapter['actions']>; accentColor?: string | null }) {
  return (
    <div className="flex flex-wrap gap-3 pt-4">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          target={action.target ?? '_self'}
          className="rounded-full border border-current/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-current/50"
          style={accentColor ? { borderColor: accentColor, color: accentColor } : undefined}
        >
          {action.label}
        </Link>
      ))}
    </div>
  )
}
