'use client'

import { useEffect, useCallback, useState, useRef, memo, useMemo, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Calendar, Camera, MapPin, HelpCircle, BookOpen, Image as ImageIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { PhotoWithDetails } from '@/types'
import { formatDate, getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DeepZoomCanvas, shouldUseDeepZoom } from './deep-zoom-canvas'
import type { FilmstripEntry } from './filmstrip-view'
import { TagStoryTooltip } from './tag-story-tooltip'
import { useOptionalCatalogEventBus } from '@/components/catalog/catalog-event-bus'
import type { CatalogRecommendationItem } from '@/types/catalog'
import type { TagStory } from '@/types/lightbox'
import { StoryDock } from './story-dock'
import { buildPhotoMetadata } from '@/lib/lightbox/metadata'
// Defer heavy sub-components to reduce initial bundle
import { usePrefetchPhotos } from './use-prefetch-photos'
import { useOptionalLightbox } from './lightbox-context'
import { useFocusTrap } from './use-focus-trap'
import { usePhotoTags } from './use-photo-tags'
import { LightboxHelpOverlay } from './lightbox-help-overlay'

function useOptionalRouter() {
  try {
    return useRouter()
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Lightbox] router unavailable, falling back to location', error)
    }
    return null
  }
}

const LABELS = {
  dialog: String.fromCharCode(0x7167, 0x7247, 0x9884, 0x89c8),
  prev: String.fromCharCode(0x4e0a, 0x4e00, 0x5f20, 0x7167, 0x7247),
  next: String.fromCharCode(0x4e0b, 0x4e00, 0x5f20, 0x7167, 0x7247),
  close: String.fromCharCode(0x5173, 0x95ed),
  help: String.fromCharCode(0x67e5, 0x770b, 0x5feb, 0x6377, 0x952e),
  counterPrefix: String.fromCharCode(0x7b2c),
  counterSuffix: String.fromCharCode(0x5f20),
  counterTotal: String.fromCharCode(0x5171),
  filmstripLoading: String.fromCharCode(0x6b63, 0x5728, 0x52a0, 0x8f7d, 0x7f29, 0x7565, 0x56fe, 0x2026),
}

const FilmstripView = dynamic(
  () => import('./filmstrip-view').then((m) => m.FilmstripView),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 flex items-center justify-center text-xs text-gray-400">
        {LABELS.filmstripLoading}
      </div>
    ),
  }
)
interface PhotoModalProps {
  photo: PhotoWithDetails
  photos: PhotoWithDetails[]
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}

export const PhotoModal = memo<PhotoModalProps>(function PhotoModal({ photo, photos, onClose, onNext, onPrevious }) {
  const lightbox = useOptionalLightbox()
  const helpOpen = lightbox?.helpOpen ?? false
  const toggleHelp = lightbox?.toggleHelp ?? (() => {})
  const filmstripEnabled = lightbox?.showFilmstrip ?? Boolean(lightbox)
  const go = lightbox?.go ?? (() => {})
  const mode = lightbox?.mode ?? 'lightbox'
  const setMode = lightbox?.setMode
  const storySequence = lightbox?.storySequence ?? null
  const storyIndex = lightbox?.storyIndex ?? 0
  const setStoryIndex = lightbox?.setStoryIndex ?? (() => {})
  const nextStoryEntry = lightbox?.nextStoryEntry ?? (() => {})
  const prevStoryEntry = lightbox?.prevStoryEntry ?? (() => {})
  const setStorySequence = lightbox?.setStorySequence
  const router = useOptionalRouter()
  const catalogBus = useOptionalCatalogEventBus()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const baseId = useId()
  const dialogTitleId = `${baseId}-title`
  const dialogDescriptionId = `${baseId}-description`
  const exifPanelId = `${baseId}-panel-exif`
  const tagsPanelId = `${baseId}-panel-tags`
  const techPanelId = `${baseId}-panel-tech`
  const dialogTitleText = photo.title || photo.album?.title || (photo as any)?.fileName || photo.id
  const dialogDescriptionText = "使用左右方向键浏览图片，按 Escape 关闭。按 H 查看快捷键。"
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
  usePrefetchPhotos(photos, currentIndex)

  const deepZoomEnabled = useMemo(() => shouldUseDeepZoom(photo), [photo])

  const storyTags = useMemo(
    () => (editingTags ? [] : localTags.filter((tag) => !tag.id.startsWith('temp-'))),
    [localTags, editingTags],
  )

  const hasStorySequence = Boolean(storySequence && storySequence.entries.length > 0)

  useEffect(() => {
    if (mode === 'story' && !hasStorySequence) {
      setMode?.('lightbox')
    }
  }, [mode, hasStorySequence, setMode])

  useEffect(() => {
    if (!photo.id) return
    const shouldFetch = !storySequence || storySequence.id.startsWith('auto-sequence-')
    if (!shouldFetch || typeof window === 'undefined' || process.env.NODE_ENV === 'test') return

    const controller = new AbortController()

    ;(async () => {
      try {
        const res = await fetch(`/api/lightbox/story?${new URLSearchParams({ id: photo.id, context: 'catalog' }).toString() }`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.sequence) {
          setStorySequence?.(data.sequence)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production' && (error as any)?.name !== 'AbortError') {
          console.warn('[Lightbox] failed to load story sequence', error)
        }
      }
    })()

    return () => controller.abort()
  }, [photo.id, storySequence, setStorySequence])

  const handleTagStoryNavigate = useCallback(
    ({ story, item }: { story: TagStory; item?: CatalogRecommendationItem }) => {
      const patch = item?.patch ?? story.cta.patch
      if (patch) {
        catalogBus?.emit('filters:update', { patch, timestamp: Date.now() })
      }

      const href = item?.href ?? story.cta.href
      if (story.cta.target === '_blank') {
        window.open(href, '_blank', 'noopener,noreferrer')
      } else if (router) {
        router.push(href)
      } else {
        window.location.href = href
      }

      lightbox?.close()
    },
    [catalogBus, router, lightbox],
  )

  const filmstripEntries = useMemo<FilmstripEntry[]>(
    () =>
      photos.map((item) => ({
        id: item.id,
        src: getImageUrl(item.id, 'small', 'webp'),
        width: item.width || photo.width || 1,
        height: item.height || photo.height || 1,
      })),
    [photos, photo.width, photo.height]
  )

  const metadata = useMemo(() => buildPhotoMetadata(photo), [photo])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
  <div ref={dialogRef} className="absolute inset-0 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId} aria-describedby={dialogDescriptionId}>
          <h2 id={dialogTitleId} className="sr-only">
            {dialogTitleText}
          </h2>
          <p id={dialogDescriptionId} className="sr-only">
            {dialogDescriptionText}
          </p>
          {/* Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={LABELS.prev}
                className="absolute left-4 z-10 bg-black/20 hover:bg-black/40 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onPrevious()
                }}
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                aria-label={LABELS.next}
                className="absolute right-4 z-10 bg-black/20 hover:bg-black/40 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onNext()
                }}
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </Button>
            </>
          )}

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white"
            onClick={(e) => { e.stopPropagation(); onClose() }}
            aria-label={LABELS.close}
          >
            <X className="h-6 w-6" aria-hidden />
          </Button>
          {hasStorySequence ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-28 z-10 bg-black/20 hover:bg-black/40 text-white"
              onClick={(e) => {
                e.stopPropagation()
                setMode?.(mode === 'story' ? 'lightbox' : 'story')
              }}
              aria-label={mode === 'story' ? '切换回光箱模式' : '切换到故事模式'}
            >
              {mode === 'story' ? <ImageIcon className="h-5 w-5" aria-hidden /> : <BookOpen className="h-5 w-5" aria-hidden />}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-16 z-10 bg-black/20 hover:bg-black/40 text-white"
            onClick={(e) => { e.stopPropagation(); toggleHelp() }}
            aria-label={LABELS.help}
          >
            <HelpCircle className="h-5 w-5" aria-hidden />
          </Button>

          {/* Photo Counter */}
          {photos.length > 1 && (
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-white text-sm" role="status" aria-live="polite" aria-atomic="true">
              {`${LABELS.counterPrefix}${currentIndex + 1}${LABELS.counterSuffix} / ${LABELS.counterTotal}${photos.length}${LABELS.counterSuffix}`}
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
              <div className="relative">
                <DeepZoomCanvas photo={photo} enabled={deepZoomEnabled} />
                {storyTags.length > 0 && (
                  <div className="pointer-events-none absolute left-4 top-4 flex max-w-[80%] flex-wrap gap-2">
                    {storyTags.map((tag) => (
                      <TagStoryTooltip
                        key={tag.id}
                        tagId={tag.id}
                        tagName={tag.name}
                        accentColor={tag.color}
                        photoId={photo.id}
                        onNavigate={handleTagStoryNavigate}
                        className="pointer-events-auto"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Info / Story Panel */}
              {mode === 'story' && storySequence ? (
                <div className="w-full lg:w-96 overflow-y-auto max-h-[80vh] lg:max-h-[90vh]">
                  <StoryDock
                    sequence={storySequence}
                    activeIndex={storyIndex}
                    onSelect={(index) => {
                      setMode?.('story')
                      setStoryIndex(index)
                    }}
                    onNext={() => {
                      setMode?.('story')
                      nextStoryEntry()
                    }}
                    onPrev={() => {
                      setMode?.('story')
                      prevStoryEntry()
                    }}
                  />
                </div>
              ) : (
                <div className="w-full lg:w-80 bg-white dark:bg-gray-900 rounded-lg p-6 overflow-y-auto max-h-[80vh] lg:max-h-[90vh]" tabIndex={0}>
                  <div className="space-y-6">
                    {/* Basic Info */}
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{metadata.headline}</h2>
                    {metadata.summary ? (
                      <p className="text-gray-600 dark:text-gray-400">{metadata.summary}</p>
                    ) : null}
                  </div>

                  {/* Date */}
                  {photo.takenAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(photo.takenAt)}</span>
                    </div>
                  )}

                  {/* Location */}
                  {metadata.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{metadata.location}</span>
                    </div>
                  )}

                  {/* Camera Info */}
                  {metadata.exif.length > 0 && (
                    <div className="space-y-2">
                      <button onClick={() => toggleSection('exif')} className="flex items-center justify-between w-full text-sm font-medium" id={exifPanelId + '-heading'} aria-expanded={!collapse.exif} aria-controls={exifPanelId}>
                        <span className="flex items-center gap-2"><Camera className="h-4 w-4" />相机信息</span>
                        <span className="text-xs opacity-60">{collapse.exif ? '展开' : '收起'}</span>
                      </button>
                      {!collapse.exif && (
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 pl-6" id={exifPanelId} role="region" aria-labelledby={exifPanelId + '-heading'}>
                          {metadata.exif.map((field) => (
                            <div key={field.label}>{field.label}： {field.value}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {localTags.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between w-full text-sm font-medium">
                        <button onClick={() => toggleSection('tags')} className="flex items-center gap-2" id={tagsPanelId + '-heading'} aria-expanded={!collapse.tags} aria-controls={tagsPanelId}>
                          <span>标签</span>
                          <span className="text-xs opacity-60">{collapse.tags ? '展开' : '收起'}</span>
                        </button>
                        <button className="text-xs underline" onClick={toggleEditing}>{editingTags ? '完成' : '编辑'}</button>
                      </div>
                      {!collapse.tags && (
                        <div className="flex flex-wrap gap-2 items-center" id={tagsPanelId} role="region" aria-labelledby={tagsPanelId + '-heading'}>
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
                                    aria-label="移除标签"
                                    className="text-red-500 opacity-0 group-hover:opacity-100 transition text-[10px]"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeTag(tag.id) }}
                                  >✕</button>
                                )}
                              </span>
                            )
                          })}
                          {editingTags && (
                            <form onSubmit={(e) => { e.preventDefault(); addTag() }} className="flex items-center gap-1">
                              <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="添加标签" className="h-6 px-2 text-xs rounded border border-gray-300 dark:border-gray-600 bg-transparent" />
                              <button type="submit" className="text-xs px-2 h-6 rounded bg-primary text-white">+</button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Technical Info */}
                  <div className="space-y-2">
                    <button onClick={() => toggleSection('tech')} className="flex items-center justify-between w-full text-sm font-medium" id={techPanelId + '-heading'} aria-expanded={!collapse.tech} aria-controls={techPanelId}>
                      <span>Technical Info</span>
                      <span className="text-xs opacity-60">{collapse.tech ? 'Show' : 'Hide'}</span>
                    </button>
                    {!collapse.tech && (
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400" id={techPanelId} role="region" aria-labelledby={techPanelId + '-heading'}>
                        <div>Dimensions: {metadata.dimensions}</div>
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
              )}
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 pointer-events-none select-none">
              {filmstripEnabled && photos.length > 1 ? (
                <div className="pointer-events-auto">
                  <FilmstripView
                    entries={filmstripEntries}
                    activeId={photo.id}
                    onSelect={(id) => {
                      const targetIndex = photos.findIndex((item) => item.id === id)
                      if (targetIndex >= 0) {
                        go(targetIndex)
                      }
                    }}
                  />
                </div>
              ) : null}
            </div>
          </motion.div>
          <LightboxHelpOverlay open={helpOpen} onClose={() => toggleHelp()} />

        </div>
      </motion.div>
    </AnimatePresence>
  )
})



