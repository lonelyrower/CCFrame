'use client'

import { useLightbox } from './lightbox-context'
import { PhotoModal } from './photo-modal'

export function Lightbox() {
  const lightbox = useLightbox()

  if (!lightbox.isOpen || !lightbox.current) {
    return null
  }

  return (
    <PhotoModal
      photo={lightbox.current}
      photos={lightbox.photos}
      onClose={lightbox.close}
      onNext={lightbox.next}
      onPrevious={lightbox.prev}
    />
  )
}