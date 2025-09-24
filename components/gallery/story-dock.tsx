'use client'

import { useEffect, useState } from 'react'
import { Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react'

import type { StorySequence } from '@/types/lightbox'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import { StoryRail } from './story-rail'
import { useOptionalPreferenceContext } from '@/components/context/preference-provider'

interface StoryDockProps {
  sequence: StorySequence
  activeIndex: number
  onSelect: (index: number) => void
  onNext: () => void
  onPrev: () => void
}

export function StoryDock({ sequence, activeIndex, onSelect, onNext, onPrev }: StoryDockProps) {
  const hasAudio = Boolean(sequence.audioSrc)
  const preference = useOptionalPreferenceContext()
  const [localAudioEnabled, setLocalAudioEnabled] = useState(false)
  const audioEnabled = preference ? preference.audioEnabled : localAudioEnabled
  const total = sequence.entries.length

  useEffect(() => {
    if (preference) {
      setLocalAudioEnabled(preference.audioEnabled)
    }
  }, [preference])

  return (
    <aside className="flex w-full flex-col gap-4 rounded-3xl border border-contrast-outline/8 bg-surface-panel/5 p-6 text-text-inverted shadow-soft backdrop-blur-2xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold leading-tight">{sequence.title}</h2>
          {sequence.description ? (
            <Text size="xs" tone="muted" className="max-w-xl">
              {sequence.description}
            </Text>
          ) : null}
          <Text size="xs" tone="muted">
            第 {activeIndex + 1} / {total} 章节
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={!hasAudio}
            aria-pressed={audioEnabled}
            aria-label={hasAudio ? (audioEnabled ? '暂停音频讲解' : '开启音频讲解') : '暂无音频'}
            className={cn('rounded-full text-text-inverted hover:bg-surface-panel/20', audioEnabled ? 'bg-surface-panel/20' : 'bg-transparent', !hasAudio && 'opacity-40')}
            onClick={() => {
              if (!hasAudio) return
              if (preference) {
                preference.setAudioEnabled(!preference.audioEnabled)
              } else {
                setLocalAudioEnabled((prev) => !prev)
              }
            }}
          >
            {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <div className="hidden items-center gap-2 md:flex">
            <Button type="button" size="icon" variant="ghost" aria-label="上一章节" onClick={onPrev}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" aria-label="下一章节" onClick={onNext}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {sequence.tags && sequence.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-[11px] text-text-inverted/70">
          {sequence.tags.slice(0, 6).map((tag) => (
            <span key={tag} className="rounded-full border border-contrast-outline/15 bg-surface-panel/10 px-3 py-1">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <StoryRail
        sequence={sequence}
        activeIndex={activeIndex}
        onSelect={onSelect}
        orientation={sequence.mode}
      />
    </aside>
  )
}
