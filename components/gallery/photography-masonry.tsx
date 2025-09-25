"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { Heart, Share2, Eye, Calendar, MapPin, Palette } from 'lucide-react'
import type { PhotoWithDetails } from "@/types"
import { GalleryPicture } from "./gallery-picture"
import { PhotoModal } from "./photo-modal"
import { useOptionalLightbox } from "./lightbox-context"
import { useFavorites } from '@/hooks/use-favorites'
import { cn } from '@/lib/utils'

interface PhotographyMasonryProps {
  photos: PhotoWithDetails[]
  loading?: boolean
  renderOverlay?: (photo: PhotoWithDetails) => ReactNode
  showMetadata?: boolean
  className?: string
}

const LOAD_STEP = 48 // Reduced for better UX
const VIEWPORT_BUFFER = 1200
const COLUMN_GAP = 24 // Increased for breathing room
const MIN_COLUMN_WIDTH = 280 // Larger minimum for better photo display

type LayoutItem = {
  photo: PhotoWithDetails
  column: number
  top: number
  height: number
  width: number
}

export function PhotographyMasonry({
  photos,
  loading = false,
  renderOverlay,
  showMetadata = true,
  className
}: PhotographyMasonryProps) {
  const lightbox = useOptionalLightbox()
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithDetails | null>(null)
  const [visibleCount, setVisibleCount] = useState(() => Math.min(LOAD_STEP, photos.length))
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [viewport, setViewport] = useState({ top: 0, bottom: 0 })
  const prefersReducedMotion = useReducedMotion()
  const { toggleFavorite, isFavorited } = useFavorites()

  // Reset when photos change
  useEffect(() => {
    setVisibleCount(Math.min(LOAD_STEP, photos.length))
    if (lightbox) {
      setSelectedPhoto(null)
    }
  }, [photos, lightbox])

  // Container width tracking with ResizeObserver
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

  // Viewport tracking for virtual scrolling
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

  // Infinite scroll sentinel
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
      { rootMargin: "800px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [visibleCount, photos.length])

  const displayPhotos = useMemo(() => photos.slice(0, visibleCount), [photos, visibleCount])

  // Dynamic column calculation optimized for photography
  const columnCount = useMemo(() => {
    if (!containerWidth || containerWidth < MIN_COLUMN_WIDTH) return 1

    // Calculate optimal column count for photo viewing
    const maxColumns = Math.floor((containerWidth + COLUMN_GAP) / (MIN_COLUMN_WIDTH + COLUMN_GAP))
    const photoCount = displayPhotos.length

    if (photoCount === 0) return 1

    // Responsive breakpoints optimized for photo galleries
    if (containerWidth >= 1600) return Math.min(maxColumns, Math.min(photoCount, 6))
    if (containerWidth >= 1200) return Math.min(maxColumns, Math.min(photoCount, 5))
    if (containerWidth >= 900) return Math.min(maxColumns, Math.min(photoCount, 4))
    if (containerWidth >= 600) return Math.min(maxColumns, Math.min(photoCount, 3))
    if (containerWidth >= 400) return Math.min(maxColumns, Math.min(photoCount, 2))

    return 1
  }, [containerWidth, displayPhotos.length])

  // Enhanced layout calculation with better aspect ratio handling
  const { layoutItems, totalHeight, columnWidth } = useMemo(() => {
    const count = Math.max(1, columnCount)
    if (!containerWidth || containerWidth < 100) {
      return { layoutItems: [] as LayoutItem[], totalHeight: 0, columnWidth: 0 }
    }

    const gap = COLUMN_GAP
    const widthAvailable = containerWidth - gap * (count - 1)
    const colWidth = count > 0 ? Math.max(widthAvailable / count, MIN_COLUMN_WIDTH) : containerWidth
    const heights = new Array(count).fill(0)

    const items: LayoutItem[] = displayPhotos.map((photo) => {
      // Ensure we have valid dimensions with better fallbacks
      const photoWidth = photo.width && photo.width > 0 ? photo.width : 1200
      const photoHeight = photo.height && photo.height > 0 ? photo.height : 800
      const aspect = photoWidth / photoHeight

      // Calculate height with improved aspect ratio handling
      let height: number
      if (aspect > 2) {
        // Very wide images (panoramic)
        height = colWidth / 2.2
      } else if (aspect < 0.6) {
        // Very tall images (portrait)
        height = colWidth / 0.7
      } else {
        // Normal aspect ratios
        height = colWidth / aspect
      }

      // Ensure reasonable bounds
      height = Math.max(height, colWidth * 0.5)
      height = Math.min(height, colWidth * 2)

      // Find the shortest column to place the item
      const column = heights.indexOf(Math.min(...heights))
      const top = heights[column]

      // Update column height
      heights[column] += height + gap

      return { photo, column, top, height, width: colWidth }
    })

    const maxHeight = heights.length ? Math.max(...heights) - gap : 0
    return {
      layoutItems: items,
      totalHeight: Math.max(maxHeight, 0),
      columnWidth: colWidth,
    }
  }, [displayPhotos, columnCount, containerWidth])

  // Virtual scrolling - only render visible items
  const visibleItems = useMemo(() => {
    if (!layoutItems.length) return []
    if (typeof window === "undefined") return layoutItems.slice(0, Math.min(LOAD_STEP, layoutItems.length))

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
          setSelectedPhoto(photo)
        }
      } catch (error) {
        console.error('Error opening photo:', error)
        setSelectedPhoto(photo)
      }
    },
    [lightbox]
  )

  const handleFavorite = useCallback((photo: PhotoWithDetails, event: React.MouseEvent) => {
    event.stopPropagation()
    toggleFavorite({
      id: photo.id,
      type: 'photo',
      title: photo.title || `作品 #${photo.id}`,
      thumbnail: photo.url,
      metadata: {
        description: photo.description,
        tags: photo.tags.map(t => t.tag.name).join(', '),
        album: photo.album?.title
      }
    })
  }, [toggleFavorite])

  if (loading) {
    return (
      <div ref={containerRef} className={cn("w-full", className)}>
        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <motion.div
              key={index}
              className="photo-skeleton rounded-2xl"
              style={{ height: Math.random() * 300 + 250 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            />
          ))}
        </div>
      </div>
    )
  }

  const hasMore = visibleCount < photos.length
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <div
        ref={containerRef}
        className={cn("relative w-full", className)}
        style={{ height: totalHeight }}
      >
        {itemsToRender.map(({ photo, column, top, height, width }) => {
          const left = column * (width + COLUMN_GAP)
          const isHovered = hoveredPhoto === photo.id
          const favorited = isFavorited(photo.id, 'photo')

          return (
            <motion.div
              key={photo.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 30, scale: 0.95 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              transition={prefersReducedMotion ? { duration: 0.2 } : {
                duration: 0.6,
                ease: [0.33, 1, 0.68, 1],
                delay: Math.random() * 0.1
              }}
              className="group cursor-pointer focus:outline-none"
              data-lightbox-return
              style={{
                position: "absolute",
                width: Math.max(width, MIN_COLUMN_WIDTH),
                height: Math.max(height, 100),
                top,
                left,
              }}
              tabIndex={0}
              role="button"
              aria-label={photo.title || `查看作品 ${photo.id}`}
              onClick={() => handleSelect(photo)}
              onMouseEnter={() => setHoveredPhoto(photo.id)}
              onMouseLeave={() => setHoveredPhoto(null)}
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
              <div className="photo-card relative h-full w-full overflow-hidden rounded-3xl bg-surface-panel/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-sm transition-all duration-500">
                <GalleryPicture
                  photo={photo}
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, (max-width: 1600px) 25vw, 20vw"
                  imgClassName="rounded-3xl object-cover transition-all duration-700 group-hover:scale-[1.03] group-hover:saturate-[1.1]"
                />

                {/* Gradient overlay for metadata */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-3xl" />

                {/* Action buttons */}
                <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <motion.button
                    onClick={(e) => handleFavorite(photo, e)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300",
                      favorited
                        ? "bg-rose-500/90 text-white shadow-lg shadow-rose-500/25"
                        : "bg-black/20 text-white/80 hover:bg-black/40 hover:text-white"
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={favorited ? "取消收藏" : "添加收藏"}
                  >
                    <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
                  </motion.button>

                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Trigger share functionality
                      console.log('Share photo:', photo.id)
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white/80 backdrop-blur-xl transition-all duration-300 hover:bg-black/40 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="分享作品"
                  >
                    <Share2 className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* Photo metadata */}
                <AnimatePresence>
                  {isHovered && showMetadata && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-x-4 bottom-4"
                    >
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl">
                        {photo.title && (
                          <h3 className="font-light text-white mb-2" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>
                            {photo.title}
                          </h3>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
                          {photo.createdAt && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(photo.createdAt)}</span>
                            </div>
                          )}

                          {photo.album && (
                            <div className="flex items-center gap-1.5">
                              <Eye className="h-3 w-3" />
                              <span>{photo.album.title}</span>
                            </div>
                          )}

                          {photo.tags.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Palette className="h-3 w-3" />
                              <span>{photo.tags[0].tag.name}</span>
                              {photo.tags.length > 1 && (
                                <span className="opacity-60">+{photo.tags.length - 1}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Custom overlay from props */}
                {renderOverlay ? renderOverlay(photo) : null}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-8 w-full" aria-hidden />

      {hasMore && (
        <motion.div
          className="py-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/5 px-6 py-3 backdrop-blur-sm">
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full opacity-60" />
            <span className="text-sm font-light text-foreground/70" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
              加载更多作品中...
            </span>
          </div>
        </motion.div>
      )}

      {/* Photo modal fallback */}
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