"use client"

import { Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { PhotoWithDetails } from '@/types'

import { FavoriteButton } from './favorite-button'
import { CompareButton } from './compare-button'

export function CatalogPhotoActions({ photo }: { photo: PhotoWithDetails }) {
  const handleContact = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const subject = encodeURIComponent('CC Frame Catalog 咨询')
    const body = encodeURIComponent(`想进一步了解作品 ${photo.id}`)
    window.open(`mailto:studio@example.com?subject=${subject}&body=${body}`, '_blank')
  }

  return (
    <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-contrast-surface/60 px-1.5 py-1 shadow">
        <FavoriteButton photo={photo} tone="inverted" />
        <CompareButton photo={photo} tone="inverted" />
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="text-text-inverted hover:bg-surface-panel/20"
          title="联系顾问"
          onClick={handleContact}
        >
          <Mail className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
