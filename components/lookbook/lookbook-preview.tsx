"use client"

import Image from 'next/image'

import type { LookbookTemplate } from '@/types/lookbook'
import { cn } from '@/lib/utils'

interface LookbookPreviewProps {
  template: LookbookTemplate
  selected?: boolean
  onSelect?: () => void
}

export function LookbookPreview({ template, selected = false, onSelect }: LookbookPreviewProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-4 rounded-[32px] border p-4 text-left transition hover:-translate-y-[2px] hover:border-contrast-outline/30 hover:shadow-floating focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:flex-row md:p-6',
        selected ? 'border-contrast-outline/60 bg-surface-panel/10 text-text-inverted shadow-floating' : 'border-contrast-outline/15 bg-contrast-surface/40 text-text-inverted/80'
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-contrast-outline/10 bg-contrast-surface/30 md:w-48">
        <Image
          src={template.previewImage}
          alt={`Lookbook template ${template.name}`}
          fill
          sizes="(max-width: 768px) 70vw, 220px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-text-inverted/50">{template.kind}</p>
          <h3 className="text-lg font-semibold text-text-inverted">{template.name}</h3>
        </div>
        <p className="text-sm leading-relaxed text-text-inverted/70">{template.description}</p>
        <div className="mt-auto flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-text-inverted/40">
          <span>格式 {template.formats.join('/')}</span>
          <span>页数 {template.pageCount}</span>
          <span>比例 {template.aspectRatio}</span>
        </div>
      </div>
    </button>
  )
}
