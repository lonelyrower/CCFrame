import Image from 'next/image'
import Link from 'next/link'

import type { ThemeCollection } from '@/types/themes'
import { ThemeAudioController } from '@/components/themes/theme-audio-controller'
import { cn } from '@/lib/utils'

interface ThemeHeroProps {
  theme: ThemeCollection
}

export function ThemeHero({ theme }: ThemeHeroProps) {
  const { hero, palette, soundtrack } = theme

  return (
    <section className="relative flex min-h-[80vh] flex-col justify-end overflow-hidden rounded-[48px] border border-contrast-outline/10 bg-contrast-surface/50 text-text-inverted shadow-floating">
      <BackgroundMedia hero={hero} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" aria-hidden="true" />

      <div className="relative z-10 grid gap-12 px-6 pb-12 pt-24 sm:px-10 md:grid-cols-[2fr_minmax(0,1fr)] md:gap-16 md:px-16 md:pb-20">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-text-inverted/60">{hero.kicker}</p>
          <div className="max-w-2xl space-y-4">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl md:text-6xl">{hero.title}</h1>
            {hero.subtitle ? <p className="text-lg text-text-inverted/70">{hero.subtitle}</p> : null}
            {hero.description ? <p className="max-w-xl text-base leading-relaxed text-text-inverted/75 md:text-lg">{hero.description}</p> : null}
          </div>
          {hero.actions?.length ? (
            <div className="flex flex-wrap gap-3">
              {hero.actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  target={action.target ?? '_self'}
                  className={cn(
                    'rounded-full border px-6 py-3 text-sm font-medium transition hover:-translate-y-[1px] hover:shadow-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                    action.accentColor ? 'border-transparent' : 'border-contrast-outline/30 bg-surface-panel/10',
                  )}
                  style={action.accentColor ? { backgroundColor: action.accentColor, borderColor: action.accentColor } : undefined}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col gap-6">
          {hero.metrics?.length ? (
            <div className="grid gap-4 rounded-3xl border border-contrast-outline/10 bg-surface-panel/5 p-6 backdrop-blur">
              {hero.metrics.map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-text-inverted/50">{metric.label}</p>
                  <p className="text-lg font-semibold text-text-inverted">{metric.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {soundtrack ? <ThemeAudioController soundtrack={soundtrack} /> : null}

          <div className="rounded-3xl border border-contrast-outline/10 bg-contrast-surface/40 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-text-inverted/50">Palette</p>
            <div className="mt-3 flex gap-2">
              {Object.entries(palette).map(([key, value]) => (
                <div key={key} className="flex flex-1 flex-col items-start gap-2">
                  <div className="h-12 w-full rounded-full" style={{ backgroundColor: value }} aria-hidden="true" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-text-inverted/60">{key}</span>
                  <span className="text-xs text-text-inverted/50">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function BackgroundMedia({ hero }: { hero: ThemeCollection['hero'] }) {
  const overlayStyle = hero.background.overlayColor ? { backgroundColor: hero.background.overlayColor } : undefined
  const content = hero.background.type === 'video' ? (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      poster={hero.background.poster ?? undefined}
      preload="metadata"
    >
      <source src={hero.background.src} />
    </video>
  ) : (
    <Image
      src={hero.background.src}
      alt={hero.background.alt ?? hero.title}
      fill
      priority
      className="object-cover"
      sizes="100vw"
    />
  )

  return (
    <div className="absolute inset-0">
      {content}
      {overlayStyle ? <div className="absolute inset-0" style={overlayStyle} aria-hidden="true" /> : null}
    </div>
  )
}
