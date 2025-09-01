'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Calendar, Camera, MapPin } from 'lucide-react'
import { PhotoWithDetails } from '@/types'
import { getImageUrl, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PhotoModalProps {
  photo: PhotoWithDetails
  photos: PhotoWithDetails[]
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}

export function PhotoModal({ photo, photos, onClose, onNext, onPrevious }: PhotoModalProps) {
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowLeft':
        onPrevious()
        break
      case 'ArrowRight':
        onNext()
        break
    }
  }, [onClose, onNext, onPrevious])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      document.body.style.overflow = 'unset'
    }
  }, [handleKeyPress])

  const currentIndex = photos.findIndex(p => p.id === photo.id)
  const exifData = photo.exifJson as any

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {/* Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-10 bg-black/20 hover:bg-black/40 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onPrevious()
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-10 bg-black/20 hover:bg-black/40 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onNext()
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Photo Counter */}
          {photos.length > 1 && (
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-white text-sm">
              {currentIndex + 1} of {photos.length}
            </div>
          )}

          {/* Main Content */}
          <motion.div
            key={photo.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative max-w-7xl max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col lg:flex-row gap-6 max-h-full">
              {/* Image */}
              <div className="relative flex-shrink-0 max-h-[80vh] lg:max-h-[90vh]">
                <Image
                  src={getImageUrl(photo.id, 'large', 'webp')}
                  alt={photo.album?.title || 'Photo'}
                  width={photo.width}
                  height={photo.height}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  priority
                />
              </div>

              {/* Info Panel */}
              <div className="w-full lg:w-80 bg-white dark:bg-gray-900 rounded-lg p-6 overflow-y-auto max-h-[80vh] lg:max-h-[90vh]">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {photo.album?.title || 'Untitled'}
                    </h2>
                    {photo.album?.description && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {photo.album.description}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  {photo.takenAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(photo.takenAt)}</span>
                    </div>
                  )}

                  {/* Location */}
                  {photo.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {(photo.location as any)?.address || 
                         `${(photo.location as any).lat?.toFixed(4)}, ${(photo.location as any).lng?.toFixed(4)}`}
                      </span>
                    </div>
                  )}

                  {/* Camera Info */}
                  {exifData && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Camera className="h-4 w-4" />
                        <span>Camera Details</span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 pl-6">
                        {exifData.camera && (
                          <div>Camera: {exifData.camera}</div>
                        )}
                        {exifData.lens && (
                          <div>Lens: {exifData.lens}</div>
                        )}
                        {exifData.focalLength && (
                          <div>Focal Length: {exifData.focalLength}mm</div>
                        )}
                        {exifData.aperture && (
                          <div>Aperture: f/{exifData.aperture}</div>
                        )}
                        {exifData.shutterSpeed && (
                          <div>Shutter: {exifData.shutterSpeed}s</div>
                        )}
                        {exifData.iso && (
                          <div>ISO: {exifData.iso}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {photo.tags.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-sm font-medium">Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {photo.tags.map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Info */}
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div>Dimensions: {photo.width} × {photo.height}</div>
                    <div>File: {photo.fileKey.split('/').pop()}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}