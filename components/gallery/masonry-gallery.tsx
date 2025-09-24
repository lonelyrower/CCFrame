"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from "framer-motion"
import type { PhotoWithDetails } from "@/types"
import { GalleryPicture } from "./gallery-picture"
import { PhotoModal } from "./photo-modal"
import { useOptionalLightbox } from "./lightbox-context"

interface MasonryGalleryProps {
  photos: PhotoWithDetails[]
  loading?: boolean
  renderOverlay?: (photo: PhotoWithDetails) => ReactNode
}

const LOAD_STEP = 60
const VIEWPORT_BUFFER = 800
const COLUMN_GAP = 16

type LayoutItem = {
  photo: PhotoWithDetails
  column: number
  top: number
  height: number
}

export function MasonryGallery({ photos, loading = false, renderOverlay }: MasonryGalleryProps) {
  const lightbox = useOptionalLightbox()
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithDetails | null>(null)
  const [visibleCount, setVisibleCount] = useState(() => Math.min(LOAD_STEP, photos.length))
  const containerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [viewport, setViewport] = useState({ top: 0, bottom: 0 })
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    setVisibleCount(Math.min(LOAD_STEP, photos.length))
    if (lightbox) {
      setSelectedPhoto(null)
    }
  }, [photos, lightbox])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const updateWidth = () => {
      const rect = node.getBoundingClientRect()
      setContainerWidth(rect.width)
    }

    updateWidth()

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateWidth)
      resizeObserver.observe(node)
    } else if (typeof window !== "undefined") {
      window.addEventListener("resize", updateWidth)
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else if (typeof window !== "undefined") {
        window.removeEventListener("resize", updateWidth)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateViewport = () => {
      const scrollY = window.scrollY
      const innerHeight = window.innerHeight
      setViewport({
        top: scrollY - VIEWPORT_BUFFER,
        bottom: scrollY + innerHeight + VIEWPORT_BUFFER,
      })
    }

    updateViewport()

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        ticking = true
        window.requestAnimationFrame(() => {
          updateViewport()
          ticking = false
        })
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    if (visibleCount >= photos.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => {
            if (current >= photos.length) return current
            return Math.min(current + LOAD_STEP, photos.length)
          })
        }
      },
      { rootMargin: "600px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [visibleCount, photos.length])

  const displayPhotos = useMemo(() => photos.slice(0, visibleCount), [photos, visibleCount])

  const derivedColumns = useMemo(() => {
    if (containerWidth >= 1280) return 5
    if (containerWidth >= 1024) return 4
    if (containerWidth >= 768) return 3
    if (containerWidth >= 640) return 2
    return 1
  }, [containerWidth])

  const columnCount = useMemo(() => {
    if (!displayPhotos.length) return 1
    return Math.max(1, Math.min(derivedColumns, displayPhotos.length))
  }, [derivedColumns, displayPhotos.length])

  const { layoutItems, totalHeight, columnWidth } = useMemo(() => {
    const count = Math.max(1, columnCount)
    if (!containerWidth || containerWidth < 100) {
      return { layoutItems: [] as LayoutItem[], totalHeight: 0, columnWidth: 0 }
    }

    const gap = COLUMN_GAP
    const widthAvailable = containerWidth - gap * (count - 1)
    const colWidth = count > 0 ? Math.max(widthAvailable / count, 50) : Math.max(containerWidth, 50)
    const heights = new Array(count).fill(0)

    const items: LayoutItem[] = displayPhotos.map((photo) => {
      // Ensure we have valid dimensions, fallback to reasonable defaults
      const photoWidth = photo.width && photo.width > 0 ? photo.width : 400
      const photoHeight = photo.height && photo.height > 0 ? photo.height : 300
      const aspect = photoWidth / photoHeight

      // Calculate height based on column width and aspect ratio
      const height = colWidth > 0 && aspect > 0 ? Math.max(colWidth / aspect, 50) : Math.max(colWidth * 0.75, 50)

      // Find the shortest column to place the item
      const column = heights.indexOf(Math.min(...heights))
      const top = heights[column]

      // Update column height
      heights[column] += height + gap

      return { photo, column, top, height }
    })

    const maxHeight = heights.length ? Math.max(...heights) - gap : 0
    return {
      layoutItems: items,
      totalHeight: maxHeight > 0 ? maxHeight : 0,
      columnWidth: colWidth,
    }
  }, [displayPhotos, columnCount, containerWidth])

  const visibleItems = useMemo(() => {
    if (!layoutItems.length) return []
    if (typeof window === "undefined") return layoutItems

    const node = containerRef.current
    const containerTop = node ? node.getBoundingClientRect().top + window.scrollY : 0
    if (viewport.top === 0 && viewport.bottom === 0) {
      return layoutItems.slice(0, Math.min(LOAD_STEP, layoutItems.length))
    }

    const start = viewport.top - containerTop
    const end = viewport.bottom - containerTop

    return layoutItems.filter((item) => {
      const itemTop = item.top
      const itemBottom = item.top + item.height
      return itemBottom >= start && itemTop <= end
    })
  }, [layoutItems, viewport])

  const itemsToRender = visibleItems.length
    ? visibleItems
    : layoutItems.slice(0, Math.min(LOAD_STEP, layoutItems.length))

  const handleSelect = useCallback(
    (photo: PhotoWithDetails) => {
      try {
        if (lightbox && typeof lightbox.open === 'function') {
          lightbox.open(photo.id)
        } else {
          // Always fallback to photo modal when lightbox is not available
          setSelectedPhoto(photo)
        }
      } catch (error) {
        console.error('Error opening photo:', error)
        // Fallback to direct photo modal
        setSelectedPhoto(photo)
      }
    },
    [lightbox]
  )

  if (loading) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="photo-skeleton"
              style={{ height: Math.random() * 200 + 200 }}
            />
          ))}
        </div>
      </div>
    )
  }

  const hasMore = visibleCount < photos.length

  return (
    <>
      <div ref={containerRef} className="relative w-full" style={{ height: totalHeight }}>
        {itemsToRender.map(({ photo, column, top, height }) => {
          const width = columnWidth || 0
          const left = column * (width + COLUMN_GAP)

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
              onClick={() => handleSelect(photo)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  handleSelect(photo)
                }
                if (event.key === "Escape") {
                  event.currentTarget.blur()
                }
              }}
            >
              <div
                className="relative h-full w-full overflow-hidden rounded-xl bg-surface-panel/60 shadow-subtle transition-all duration-500 ease-[var(--ease-soft)] hover:-translate-y-1 hover:shadow-surface dark:bg-surface-panel/40"
                style={{
                  aspectRatio: photo.width && photo.height
                    ? `${photo.width} / ${photo.height}`
                    : '4 / 3'
                }}
              >
                <GalleryPicture
                  photo={photo}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  imgClassName="rounded-xl object-cover transition-transform duration-[var(--duration-medium)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
                />

                {renderOverlay ? renderOverlay(photo) : null}

                {photo.tags.length > 0 && ( 
                  <div className="pointer-events-none absolute inset-x-3 top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex flex-wrap gap-2 text-xs text-text-inverted">
                      {photo.tags.slice(0, 2).map(({ tag }) => (
                        <span key={tag.id} className="rounded-full bg-contrast-surface/60 px-2 py-0.5 shadow">
                          {tag.name}
                        </span>
                      ))}
                      {photo.tags.length > 2 && (
                        <span className="rounded-full bg-contrast-surface/60 px-2 py-0.5 shadow">
                          +{photo.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
      {hasMore && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Loading more inspiration...
        </div>
      )}

      {lightbox === null && selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          photos={displayPhotos}
          onClose={() => setSelectedPhoto(null)}
          onNext={() => {
            const currentIndex = displayPhotos.findIndex((item) => item.id === selectedPhoto.id)
            const nextIndex = (currentIndex + 1) % displayPhotos.length
            setSelectedPhoto(displayPhotos[nextIndex])
          }}
          onPrevious={() => {
            const currentIndex = displayPhotos.findIndex((item) => item.id === selectedPhoto.id)
            const prevIndex = (currentIndex - 1 + displayPhotos.length) % displayPhotos.length
            setSelectedPhoto(displayPhotos[prevIndex])
          }}
        />
      )}
    </>
  )
}








