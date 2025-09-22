"use client"

import { Scissors, ScissorsLineDashed } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PhotoWithDetails } from '@/types'

import { useCompare } from './compare-provider'

type CompareButtonProps = {
  photo: PhotoWithDetails
  size?: 'sm' | 'md'
  tone?: 'default' | 'inverted'
  className?: string
}

export function CompareButton({ photo, size = 'sm', tone = 'default', className }: CompareButtonProps) {
  const compare = useCompare()
  const isComparing = compare.isComparing(photo.id)

  const variant = tone === 'default' ? (isComparing ? 'secondary' : 'ghost') : 'ghost'
  const classes = tone === 'inverted'
    ? cn(
        'text-white hover:bg-white/20',
        isComparing ? 'bg-white/20 text-white' : '',
        className,
      )
    : className

  return (
    <Button
      type="button"
      size={size === 'sm' ? 'icon-sm' : 'icon'}
      variant={variant}
      aria-pressed={isComparing}
      title={isComparing ? '移出对比' : '加入对比'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (isComparing) {
          compare.remove(photo.id)
        } else {
          compare.add(photo)
        }
      }}
      className={classes}
    >
      {isComparing ? <Scissors className="h-4 w-4" /> : <ScissorsLineDashed className="h-4 w-4" />}
    </Button>
  )
}
