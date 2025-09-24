"use client"

import { Star, StarOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PhotoWithDetails } from '@/types'

import { useFavorites } from './favorite-provider'

type FavoriteButtonProps = {
  photo: PhotoWithDetails
  size?: 'sm' | 'md'
  tone?: 'default' | 'inverted'
  className?: string
}

export function FavoriteButton({ photo, size = 'sm', tone = 'default', className }: FavoriteButtonProps) {
  const favorites = useFavorites()
  const isFavorite = favorites.isFavorite(photo.id)

  const variant = tone === 'default' ? (isFavorite ? 'secondary' : 'ghost') : 'ghost'
  const classes = tone === 'inverted'
    ? cn(
        'text-text-inverted hover:bg-surface-panel/20',
        isFavorite ? 'bg-surface-panel/20 text-text-inverted' : '',
        className,
      )
    : className

  return (
    <Button
      type="button"
      size={size === 'sm' ? 'icon-sm' : 'icon'}
      variant={variant}
      aria-pressed={isFavorite}
      title={isFavorite ? '移除收藏' : '加入收藏'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        favorites.toggle(photo)
      }}
      className={classes}
    >
      {isFavorite ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
    </Button>
  )
}
