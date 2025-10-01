'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { motion, useInView, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { PhotoWithDetails } from '@/types'
import { getImageUrl, toBase64 } from '@/lib/utils'
import { PhotoModal } from './photo-modal'
import { useOptionalLightbox } from './lightbox-context'

interface EnhancedGalleryProps {
  photos: PhotoWithDetails[]
  loading?: boolean
}

const GRID_GAP = 16

// 智能瀑布流布局算法
function useSmartMasonryLayout(photos: PhotoWithDetails[], columns: number, columnWidth: number) {
  return useMemo(() => {
    if (columns === 0) return []

    const effectiveWidth = columnWidth > 0 ? columnWidth : 320
    const columnHeights = new Array(columns).fill(0)

    return photos.map((photo, index) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights))
      const hasValidSize = (photo.width ?? 0) > 0 && (photo.height ?? 0) > 0
      const aspectRatio = hasValidSize ? (photo.height ?? 1) / (photo.width ?? 1) : 1
      const scaledHeight = aspectRatio * effectiveWidth

      columnHeights[shortestColumn] += scaledHeight + GRID_GAP

      return {
        ...photo,
        column: shortestColumn,
        height: scaledHeight,
        index
      }
    })
  }, [photos, columns, columnWidth])
}

export function EnhancedGallery({ photos, loading = false }: EnhancedGalleryProps) {
  const lb = useOptionalLightbox()
  const open = lb?.open ?? (() => {})
  const close = lb?.close ?? (() => {})
  const isOpen = lb?.isOpen ?? false
  const current = lb?.current
  const next = lb?.next ?? (() => {})
  const prev = lb?.prev ?? (() => {})

  const [columns, setColumns] = useState(1)
  const [columnWidth, setColumnWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollY = useMotionValue(0)

  const layout = useSmartMasonryLayout(photos, columns, columnWidth)

  // 响应式列数
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return
      const width = containerRef.current.offsetWidth
      let nextColumns = 1
      if (width < 640) nextColumns = 1
      else if (width < 768) nextColumns = 2
      else if (width < 1024) nextColumns = 3
      else if (width < 1280) nextColumns = 4
      else nextColumns = 5

      setColumns(nextColumns)
      if (nextColumns > 0) {
        const totalGap = GRID_GAP * Math.max(0, nextColumns - 1)
        const available = Math.max(width - totalGap, 0)
        const computedWidth = available / nextColumns
        setColumnWidth(Number.isFinite(computedWidth) ? computedWidth : width)
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])


  // 滚动监听
  useEffect(() => {
    const handleScroll = () => scrollY.set(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollY])

  if (loading) {
    return <EnhancedGallerySkeleton />
  }

  return (
    <>
      <div ref={containerRef} className="container mx-auto px-4 py-8">
        <div
          className="relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${GRID_GAP}px`,
            alignItems: 'start'
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-4">
              {layout
                .filter(photo => photo.column === colIndex)
                .map((photo, index) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    index={photo.index}
                    scrollY={scrollY}
                    onOpen={open}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>

      {isOpen && current && (
        <PhotoModal
          photo={current}
          photos={photos}
          onClose={close}
          onNext={next}
          onPrevious={prev}
        />
      )}
    </>
  )
}

// 单个照片卡片组件
function PhotoCard({
  photo,
  index,
  scrollY,
  onOpen
}: {
  photo: PhotoWithDetails & { column: number; height: number; index: number }
  index: number
  scrollY: any
  onOpen: (id: string) => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const isInView = useInView(ref, { once: true, margin: "100px" })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [hover, setHover] = useState(false)

  // 进入视口时增加轻微浮动感
  const y = useTransform(scrollY, [0, 1000], [0, -50])
  const rotateX = useTransform(scrollY, [0, 1000], [0, 2])
  const accessibleLabel = photo.album?.title || photo.tags[0]?.tag?.name || "查看照片"

  return (
    <motion.button
      ref={ref}
      type="button"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.4, 0.25, 1]
      }}
      whileHover={{
        scale: 1.03,
        rotateY: hover ? 5 : 0,
        z: 50,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      }}
      style={{ y, rotateX }}
      className="group relative w-full cursor-pointer rounded-xl bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      data-lightbox-return
      onClick={() => onOpen(photo.id)}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      aria-label={accessibleLabel}
    >
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-surface-panel/90 to-surface-panel/70 dark:from-surface-panel/80 dark:to-surface-canvas/90 shadow-surface hover:shadow-floating transition-shadow duration-500">

        {/* 照片 */}
        <div className="relative overflow-hidden">
          <AnimatePresence>
            {!imageLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="animate-pulse bg-surface-panel dark:bg-surface-panel w-8 h-8 rounded-full" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{
              scale: imageLoaded ? 1 : 1.1,
              opacity: imageLoaded ? 1 : 0
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Image
              src={getImageUrl(photo.id, 'small', 'webp')}
              alt={photo.album?.title || photo.tags[0]?.tag?.name || 'Photo'}
              width={photo.width ?? 800}
              height={photo.height ?? 600}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(
                `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="300" fill="url(#grad)"/>
                </svg>`
              )}`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const img = e.target as HTMLImageElement
                if (img.src.includes('webp')) {
                  img.src = getImageUrl(photo.id, 'small', 'jpeg')
                }
              }}
            />
          </motion.div>
        </div>

        {/* 遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-contrast-surface/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* 信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: hover ? 1 : 0, y: hover ? 0 : 20 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 p-4 text-text-inverted"
        >
          {photo.album?.title && (
            <h3 className="text-sm font-medium truncate mb-1">
              {photo.album.title}
            </h3>
          )}

          {photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {photo.tags.slice(0, 2).map(({ tag }) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 text-xs font-medium bg-surface-panel/20 rounded-full backdrop-blur-sm"
                >
                  {tag.name}
                </span>
              ))}
              {photo.tags.length > 2 && (
                <span className="px-2 py-1 text-xs font-medium bg-surface-panel/20 rounded-full backdrop-blur-sm">
                  +{photo.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </motion.div>

        {!imageLoaded && (
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </motion.button>
  )
}

// 骨架屏组件
function EnhancedGallerySkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 12 }).map((_, i) => {
          const heights = [220, 260, 240, 300, 280]
          const height = heights[i % heights.length]
          return (
            <div
              key={i}
              className="animate-pulse bg-gradient-to-br from-surface-panel/80 to-surface-panel/70 dark:from-surface-panel/70 dark:to-surface-canvas/80 rounded-xl"
              style={{
                height: `${height}px`,
                animationDelay: `${i * 80}ms`
              }}
            />
          )
        })}
      </div>
    </div>
  )
}


