import { cn } from '@/lib/utils'

interface TimelineTooltipProps {
  label: string
  description?: string | null
  align?: 'left' | 'right'
  accentColor?: string | null
}

export function TimelineTooltip({ label, description, align = 'left', accentColor }: TimelineTooltipProps) {
  return (
    <div
      className={cn(
        'pointer-events-none hidden md:block',
        align === 'left' ? '-translate-x-[110%]' : 'translate-x-[10%]'
      )}
    >
      <div
        className="rounded-full border border-white/10 bg-black/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 shadow-lg"
        style={accentColor ? { borderColor: accentColor, color: accentColor } : undefined}
      >
        {label}
      </div>
      {description ? (
        <p className="mt-2 max-w-[220px] text-[11px] leading-relaxed text-white/60">{description}</p>
      ) : null}
    </div>
  )
}
