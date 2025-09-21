'use client'

import { memo } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import type { PhotoWithDetails } from '@/types'
import { getImageUrl, toBase64 } from '@/lib/utils'

interface OptimizedPhotoItemProps {
  photo: PhotoWithDetails
  column: number
  top: number
  height: number
  columnWidth: number
  columnGap: number
  onSelect: (photo: PhotoWithDetails) => void
}

const OptimizedPhotoItem = memo<OptimizedPhotoItemProps>(({
  photo,
  column,
  top,
  height,
  columnWidth,
  columnGap,
  onSelect
}) => {
  const prefersReducedMotion = useReducedMotion()
  const width = columnWidth || 0
  const left = column * (width + columnGap)

  const handleClick = () => onSelect(photo)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSelect(photo)
    }
    if (event.key === "Escape") {
      (event.currentTarget as HTMLElement).blur()
    }
  }

  return (
    <motion.div
      key={photo.id}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 0.3, ease: "easeOut" }}
      className="group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      data-lightbox-return
      style={{
        position: "absolute",
        width: Math.max(width, 50),
        height: Math.max(height, 50),
        top,
        left,
      }}
      tabIndex={0}
      role="button"
      aria-label={photo.album?.title || photo.tags?.[0]?.tag?.name || "Open photo"}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 shadow-sm transition-all duration-500 ease-[var(--ease-soft)] hover:-translate-y-1 hover:shadow-lg">
        <Image
          src={getImageUrl(photo.id, "small", "webp")}
          alt={photo.album?.title || "Photo"}
          width={photo.width || 400}
          height={photo.height || 300}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className="w-full h-full rounded-xl object-cover transition-transform duration-[var(--duration-medium)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
          style={{
            aspectRatio: photo.width && photo.height
              ? `${photo.width} / ${photo.height}`
              : '4 / 3'
          }}
          placeholder="blur"
          blurDataURL={`data:image/svg+xml;base64,${toBase64(
            `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#f3f4f6"/></svg>`
          )}`}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement
            if (img.src.includes("webp")) {
              img.src = `/api/image/${photo.id}/small?format=jpeg`
            } else if (img.src.includes("/api/image/") && img.src.includes("small")) {
              img.src = `/api/image/${photo.id}/thumb?format=jpeg`
            } else if (!img.src.includes("serve")) {
              img.src = `/api/image/serve/${photo.id}/small?format=jpeg`
            }
          }}
        />

        {photo.tags.length > 0 && (
          <div className="pointer-events-none absolute inset-x-3 top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex flex-wrap gap-2 text-xs text-white">
              {photo.tags.slice(0, 2).map(({ tag }) => (
                <span key={tag.id} className="rounded-full bg-black/60 px-2 py-0.5 shadow">
                  {tag.name}
                </span>
              ))}
              {photo.tags.length > 2 && (
                <span className="rounded-full bg-black/60 px-2 py-0.5 shadow">
                  +{photo.tags.length - 2}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
})

OptimizedPhotoItem.displayName = 'OptimizedPhotoItem'

export default OptimizedPhotoItem