'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Calendar, Camera, MapPin } from 'lucide-react'
import { PhotoWithDetails } from '@/types'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PhotoZoomCanvas } from './photo-zoom-canvas'
import dynamic from 'next/dynamic'
// Defer heavy sub-components to reduce initial bundle
const PhotoFilmstrip = dynamic(() => import('./photo-filmstrip').then(m => m.PhotoFilmstrip), { ssr: false, loading: () => <div className="h-16 flex items-center justify-center text-xs text-gray-400">Loading filmstrip...</div> })
import { usePrefetchPhotos } from './use-prefetch-photos'
import { useLightbox } from './lightbox-context'
import { useFocusTrap } from './use-focus-trap'
import { usePhotoTags } from './use-photo-tags'

interface PhotoModalProps {
  photo: PhotoWithDetails
  photos: PhotoWithDetails[]
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}

export function PhotoModal({ photo, photos, onClose, onNext, onPrevious }: PhotoModalProps) {
  const { helpOpen, toggleHelp } = useLightbox()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [newTag, setNewTag] = useState('')
  const { tags: localTags, editing: editingTags, toggleEditing, addTag: addTagHook, removeTag: removeTagHook } = usePhotoTags(photo.id, photo.tags.map(t => t.tag))
  const [collapse, setCollapse] = useState<{[k:string]: boolean}>({ exif: false, tags: false, tech: false })
  const toggleSection = (key: string) => setCollapse(s => ({ ...s, [key]: !s[key] }))
  // Keyboard events are handled by LightboxProvider to avoid double-triggering
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])
  useFocusTrap(dialogRef as any, true, {
    initialFocus: () => dialogRef.current?.querySelector('button') as HTMLElement | null,
    returnFocus: () => document.body.querySelector('[data-lightbox-return]') as HTMLElement | null
  })

  const addTag = async () => { await addTagHook(newTag); setNewTag('') }
  const removeTag = async (tagId: string) => { await removeTagHook(tagId) }

  const currentIndex = photos.findIndex(p => p.id === photo.id)
  const exifData = photo.exifJson as any
  usePrefetchPhotos(photos, currentIndex)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
  <div ref={dialogRef} className="absolute inset-0 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Photo lightbox">
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
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-16 z-10 bg-black/20 hover:bg-black/40 text-white px-2"
            onClick={(e) => { e.stopPropagation(); toggleHelp() }}
          >
            ?
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
              {/* Image / Zoom Canvas */}
              <PhotoZoomCanvas photo={photo} />

              {/* Info Panel */}
              <div className="w-full lg:w-80 bg-white dark:bg-gray-900 rounded-lg p-6 overflow-y-auto max-h-[80vh] lg:max-h-[90vh]" tabIndex={0}>
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
                    <div className="space-y-2">
                      <button onClick={() => toggleSection('exif')} className="flex items-center justify-between w-full text-sm font-medium">
                        <span className="flex items-center gap-2"><Camera className="h-4 w-4" />Camera Details</span>
                        <span className="text-xs opacity-60">{collapse.exif ? 'Show' : 'Hide'}</span>
                      </button>
                      {!collapse.exif && (
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 pl-6">
                          {exifData.camera && <div>Camera: {exifData.camera}</div>}
                          {exifData.lens && <div>Lens: {exifData.lens}</div>}
                          {exifData.focalLength && <div>Focal Length: {exifData.focalLength}mm</div>}
                          {exifData.aperture && <div>Aperture: f/{exifData.aperture}</div>}
                          {exifData.shutterSpeed && <div>Shutter: {exifData.shutterSpeed}s</div>}
                          {exifData.iso && <div>ISO: {exifData.iso}</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {localTags.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between w-full text-sm font-medium">
                        <button onClick={() => toggleSection('tags')} className="flex items-center gap-2">
                          <span>Tags</span>
                          <span className="text-xs opacity-60">{collapse.tags ? 'Show' : 'Hide'}</span>
                        </button>
                        <button className="text-xs underline" onClick={toggleEditing}>{editingTags ? 'Done' : 'Edit'}</button>
                      </div>
                      {!collapse.tags && (
                        <div className="flex flex-wrap gap-2 items-center">
                          {localTags.map(tag => {
                            const pending = tag.id.startsWith('temp-')
                            return (
                              <span
                                key={tag.id}
                                data-pending={pending || undefined}
                                className={`group relative px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${pending ? 'bg-gray-400/30 text-gray-300 animate-pulse' : 'bg-primary/10 text-primary'}`}
                              >
                                {tag.name}
                                {pending && (
                                  <svg className="h-3 w-3 animate-spin text-gray-300" viewBox="0 0 24 24" aria-hidden>
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                                  </svg>
                                )}
                                {editingTags && !pending && (
                                  <button
                                    aria-label="Remove tag"
                                    className="text-red-500 opacity-0 group-hover:opacity-100 transition text-[10px]"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeTag(tag.id) }}
                                  >✕</button>
                                )}
                              </span>
                            )
                          })}
                          {editingTags && (
                            <form onSubmit={(e) => { e.preventDefault(); addTag() }} className="flex items-center gap-1">
                              <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add tag" className="h-6 px-2 text-xs rounded border border-gray-300 dark:border-gray-600 bg-transparent" />
                              <button type="submit" className="text-xs px-2 h-6 rounded bg-primary text-white">+</button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Technical Info */}
                  <div className="space-y-2">
                    <button onClick={() => toggleSection('tech')} className="flex items-center justify-between w-full text-sm font-medium">
                      <span>Technical Info</span>
                      <span className="text-xs opacity-60">{collapse.tech ? 'Show' : 'Hide'}</span>
                    </button>
                    {!collapse.tech && (
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>Dimensions: {photo.width} × {photo.height}</div>
                        <div>File: {photo.fileKey?.split('/').pop() || 'Unknown'}</div>
                        {photo.location && (photo.location as any).lat && (photo.location as any).lng && (
                          <div className="mt-2">
                            <span className="block text-xs mb-1 opacity-70">Map Preview</span>
                            <canvas
                              data-map-preview
                              className="w-full h-24 rounded bg-gray-200 dark:bg-gray-800"
                              ref={el => {
                                if (!el) return
                                const ctx = el.getContext('2d')
                                if (!ctx) return
                                const w = el.width = el.clientWidth
                                const h = el.height = el.clientHeight
                                ctx.fillStyle = '#1f2937'
                                ctx.fillRect(0,0,w,h)
                                // simplistic lat/lng plot: convert to pseudo coords
                                const lat = (photo.location as any).lat
                                const lng = (photo.location as any).lng
                                const x = ((lng + 180) / 360) * w
                                const y = ((90 - lat) / 180) * h
                                ctx.fillStyle = '#10b981'
                                ctx.beginPath()
                                ctx.arc(x, y, 6, 0, Math.PI * 2)
                                ctx.fill()
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 pointer-events-none select-none">
              {photos.length > 1 && <PhotoFilmstrip />}
            </div>
          </motion.div>
          {helpOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-8" onClick={(e) => { e.stopPropagation(); toggleHelp() }}>
              <div className="max-w-lg w-full space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                  <span className="text-xs opacity-70">Press ? or click to close</span>
                </div>
                <ul className="grid grid-cols-2 gap-3">
                  <li><kbd className="px-2 py-1 bg-white/10 rounded">← / A</kbd> Prev photo</li>
                  <li><kbd className="px-2 py-1 bg-white/10 rounded">→ / D</kbd> Next photo</li>
                  <li><kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd> Close viewer</li>
                  <li><kbd className="px-2 py-1 bg-white/10 rounded">?/H</kbd> Toggle help</li>
                  <li><kbd className="px-2 py-1 bg-white/10 rounded">+</kbd> Zoom in</li>
                  <li><kbd className="px-2 py-1 bg-white/10 rounded">-</kbd> Zoom out</li>
                  <li><kbd className="px-2 py-1 bg-white/10 rounded">Double Click</kbd> Zoom toggle</li>
                  <li><kbd className="px-2 py-1 bg-white/10 rounded">Drag</kbd> Pan when zoomed</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}