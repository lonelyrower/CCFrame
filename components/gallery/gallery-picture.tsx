"use client"

import { useMemo, useRef } from 'react'

import { generateSrcSet, getImageUrl, cn } from '@/lib/utils'
import { trackImageLoading } from '@/lib/performance-monitor'

type PictureSubject = {
  id: string
  album?: { title?: string | null } | null
  albumTitle?: string | null
  tags?: Array<{ tag?: { name?: string | null } } | { name?: string | null } | Record<string, any>>
}

interface GalleryPictureProps {
  photo: PictureSubject
  className?: string
  imgClassName?: string
  sizes?: string
  priorityVariant?: 'thumb' | 'small' | 'medium'
}

function resolveAlt(photo: PictureSubject) {
  if (photo.album?.title) return photo.album.title
  if (photo.albumTitle) return photo.albumTitle
  const firstTag = photo.tags?.find((tag) => {
    if (!tag) return false
    if (typeof (tag as any).name === 'string') return Boolean((tag as any).name)
    if (typeof (tag as any).tag?.name === 'string') return Boolean((tag as any).tag?.name)
    return false
  }) as any
  return firstTag?.name || firstTag?.tag?.name || 'Photo'
}

export function GalleryPicture({
  photo,
  className,
  imgClassName,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  priorityVariant = 'small',
}: GalleryPictureProps) {
  const { onLoad, onError } = trackImageLoading(photo.id, priorityVariant)
  const fallbackIndexRef = useRef(0)

  const prefetchTargets = useMemo(
    () => [getImageUrl(photo.id, 'medium', 'avif'), getImageUrl(photo.id, 'medium', 'webp')].join(','),
    [photo.id],
  )

  const jpegFallbacks = useMemo(
    () => [
      getImageUrl(photo.id, priorityVariant, 'jpeg'),
      getImageUrl(photo.id, 'thumb', 'jpeg'),
      `/api/image/serve/${photo.id}/${priorityVariant}?format=jpeg`,
    ],
    [photo.id, priorityVariant],
  )

  const avifSrcSet = useMemo(() => generateSrcSet(photo.id, 'avif'), [photo.id])
  const webpSrcSet = useMemo(() => generateSrcSet(photo.id, 'webp'), [photo.id])
  const jpegSrcSet = useMemo(() => generateSrcSet(photo.id, 'jpeg'), [photo.id])

  return (
    <picture className={cn('block h-full w-full', className)} data-prefetch-url={prefetchTargets}>
      <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
      <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      <img
        src={getImageUrl(photo.id, priorityVariant, 'jpeg')}
        srcSet={jpegSrcSet}
        sizes={sizes}
        loading="lazy"
        decoding="async"
        alt={resolveAlt(photo)}
        className={cn(
          'h-full w-full rounded-xl object-cover transition-opacity duration-500 ease-out motion-safe:will-change-opacity',
          'opacity-0',
          imgClassName,
        )}
        onLoad={(event) => {
          onLoad()
          event.currentTarget.classList.add('opacity-100')
        }}
        onError={(event) => {
          const target = event.currentTarget
          const nextIndex = fallbackIndexRef.current
          if (nextIndex < jpegFallbacks.length) {
            target.src = jpegFallbacks[nextIndex]
            target.srcset = `${jpegFallbacks[nextIndex]} 1x`
            fallbackIndexRef.current = nextIndex + 1
          } else {
            onError()
          }
        }}
        referrerPolicy="no-referrer"
      />
    </picture>
  )
}
