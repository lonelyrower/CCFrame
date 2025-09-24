'use client'

import Image from 'next/image'
import type { StorySequence } from '@/types/lightbox'
import { cn } from '@/lib/utils'

interface StoryRailProps {
  sequence: StorySequence
  activeIndex: number
  onSelect: (index: number) => void
  orientation?: 'horizontal' | 'vertical'
}

export function StoryRail({ sequence, activeIndex, onSelect, orientation = 'horizontal' }: StoryRailProps) {
  const isHorizontal = orientation === 'horizontal'
  const containerClass = cn(
    'story-rail flex gap-4 rounded-3xl border border-contrast-outline/10 bg-surface-panel/5 p-4 backdrop-blur-xl',
    isHorizontal ? 'flex-row overflow-x-auto' : 'flex-col max-h-[60vh] overflow-y-auto'
  )

  return (
    <div className={containerClass}>
      {sequence.entries.map((entry, index) => {
        const isActive = index === activeIndex
        const directionClasses = isHorizontal ? 'min-w-[220px]' : 'w-full'

        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              'group relative flex flex-col gap-3 rounded-2xl border border-contrast-outline/5 bg-surface-panel/0 p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              directionClasses,
              isActive ? 'border-primary/60 bg-primary/10 shadow-surface' : 'hover:border-contrast-outline/20 hover:bg-surface-panel/10'
            )}
            aria-current={isActive}
          >
            <div className="relative h-36 w-full overflow-hidden rounded-xl bg-surface-panel/5">
              {entry.thumbnailUrl ? (
                <Image
                  src={entry.thumbnailUrl}
                  alt={entry.title}
                  fill
                  sizes="240px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-text-inverted/60">
                  No preview
                </div>
              )}
              <div
                className={cn(
                  'absolute bottom-3 left-3 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest text-text-inverted/80 shadow-subtle backdrop-blur',
                  isActive ? 'bg-primary/80' : 'bg-contrast-surface/40'
                )}
              >
                {index + 1}/{sequence.entries.length}
              </div>
            </div>
            <div className="space-y-1">
              <p className={cn('text-sm font-semibold text-text-inverted', isActive ? 'opacity-100' : 'opacity-90 group-hover:opacity-100')}>
                {entry.title}
              </p>
              {entry.subtitle ? (
                <p className="text-xs text-text-inverted/60">{entry.subtitle}</p>
              ) : null}
              {entry.timestamp ? (
                <p className="text-[11px] text-text-inverted/40">{entry.timestamp}</p>
              ) : null}
            </div>
          </button>
        )
      })}
    </div>
  )
}

