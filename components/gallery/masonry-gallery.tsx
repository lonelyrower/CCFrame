'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { PhotoWithDetails } from '@/types'
import { getImageUrl, generateSrcSet, toBase64 } from '@/lib/utils'
import { PhotoModal } from './photo-modal'

interface MasonryGalleryProps {
  photos: PhotoWithDetails[]
  loading?: boolean
}

export function MasonryGallery({ photos, loading = false }: MasonryGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithDetails | null>(null)
  const [columns, setColumns] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return
      
      const width = containerRef.current.offsetWidth
      if (width >= 1280) setColumns(5)
      else if (width >= 1024) setColumns(4)
      else if (width >= 768) setColumns(3)
      else if (width >= 640) setColumns(2)
      else setColumns(1)
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  // Distribute photos across columns
  const distributePhotos = (photos: PhotoWithDetails[], columnCount: number) => {
    const columnHeights = new Array(columnCount).fill(0)
    const columnPhotos: PhotoWithDetails[][] = new Array(columnCount).fill(null).map(() => [])

    photos.forEach(photo => {
      // Find column with minimum height
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights))
      columnPhotos[shortestColumn].push(photo)
      
      // Estimate height based on aspect ratio
      const aspectRatio = photo.width / photo.height
      const estimatedHeight = 300 / aspectRatio + 16 // 300px width + gap
      columnHeights[shortestColumn] += estimatedHeight
    })

    return columnPhotos
  }

  const columnPhotos = distributePhotos(photos, columns)

  if (loading) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="space-y-4">
              {Array.from({ length: Math.ceil(8 / columns) }).map((_, index) => (
                <div 
                  key={index} 
                  className="photo-skeleton"
                  style={{ 
                    height: Math.random() * 200 + 200,
                    aspectRatio: Math.random() * 0.5 + 0.7 
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div ref={containerRef} className="w-full">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {columnPhotos.map((columnImages, colIndex) => (
            <div key={colIndex} className="space-y-4">
              {columnImages.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (colIndex + index) * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
                    <Image
                      src={getImageUrl(photo.id, 'small', 'webp')}
                      alt={photo.album?.title || 'Photo'}
                      width={photo.width}
                      height={photo.height}
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                      placeholder="blur"
                      blurDataURL={`data:image/svg+xml;base64,${toBase64(
                        `<svg width=\"400\" height=\"300\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"400\" height=\"300\" fill=\"#f3f4f6\"/></svg>`
                      )}`}
                      onError={(e) => {
                        console.error('Gallery image failed to load:', photo.id, photo.album?.title)
                        const img = e.target as HTMLImageElement
                        if (img.src.includes('webp')) {
                          console.log('Retrying with JPEG format')
                          img.src = getImageUrl(photo.id, 'small', 'jpeg')
                        } else if (img.src.includes('small')) {
                          console.log('Retrying with thumb size')
                          img.src = getImageUrl(photo.id, 'thumb', 'webp')
                        } else if (img.src.includes('thumb')) {
                          console.log('Retrying with original API route')
                          img.src = `/api/image/${photo.id}/small?format=jpeg`
                        }
                      }}
                    />
                    
                    {photo.tags.length > 0 && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-wrap gap-1">
                          {photo.tags.slice(0, 3).map(({ tag }) => (
                            <span
                              key={tag.id}
                              className="px-2 py-1 text-xs font-medium text-white bg-black/50 rounded-full backdrop-blur-sm"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {photo.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs font-medium text-white bg-black/50 rounded-full backdrop-blur-sm">
                              +{photo.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          photos={photos}
          onClose={() => setSelectedPhoto(null)}
          onNext={() => {
            const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
            const nextIndex = (currentIndex + 1) % photos.length
            setSelectedPhoto(photos[nextIndex])
          }}
          onPrevious={() => {
            const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
            const prevIndex = (currentIndex - 1 + photos.length) % photos.length
            setSelectedPhoto(photos[prevIndex])
          }}
        />
      )}
    </>
  )
}
