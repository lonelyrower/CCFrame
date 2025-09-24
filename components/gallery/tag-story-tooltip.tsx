'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Sparkles, ArrowRight, Link as LinkIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { catalogNumberFormatter } from '@/lib/catalog-data'
import type { TagStory } from '@/types/lightbox'
import type { CatalogRecommendationItem } from '@/types/catalog'
import { recordTagStoryViewed, recordTagStoryCTA, recordTagStoryDismissed } from '@/lib/analytics/story-events'

interface TagStoryTooltipProps {
  tagId: string
  tagName: string
  photoId?: string
  accentColor?: string | null
  onNavigate?: (payload: { story: TagStory; item?: CatalogRecommendationItem }) => void
  className?: string
}

interface StoryState {
  story: TagStory | null
  recommendations: CatalogRecommendationItem[]
}

export function TagStoryTooltip({
  tagId,
  tagName,
  photoId,
  accentColor,
  onNavigate,
  className,
}: TagStoryTooltipProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [{ story, recommendations }, setStoryState] = useState<StoryState>({ story: null, recommendations: [] })
  const hasTrackedViewRef = useRef(false)
  const fetchStartedRef = useRef(false)
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const effectiveTagId = tagId
  const effectiveTagName = useMemo(() => tagName || story?.tagName || '', [tagName, story?.tagName])

  const clearCloseTimeout = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current)
      closeTimeout.current = null
    }
  }

  const scheduleClose = () => {
    clearCloseTimeout()
    closeTimeout.current = setTimeout(() => {
      setOpen(false)
      if (story) {
        recordTagStoryDismissed(story, { photoId })
      }
    }, 120)
  }

  const handlePointerEnter = () => {
    clearCloseTimeout()
    setOpen(true)
  }

  const handlePointerLeave = () => {
    if (!open) return
    scheduleClose()
  }

  const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.target)) {
      clearCloseTimeout()
      setOpen(true)
    }
  }

  const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    const nextFocus = event.relatedTarget as Node | null
    if (!event.currentTarget.contains(nextFocus)) {
      scheduleClose()
    }
  }

  useEffect(() => {
    return () => {
      clearCloseTimeout()
    }
  }, [])

  useEffect(() => {
    if (!open || fetchStartedRef.current) return

    fetchStartedRef.current = true
    setLoading(true)
    setError(null)

    const controller = new AbortController()
    let succeeded = false

    ;(async () => {
      try {
        const storyRes = await fetch(
          `/api/lightbox/tag-story?${new URLSearchParams({
            ...(effectiveTagId ? { tagId: effectiveTagId } : {}),
            ...(tagName ? { tag: tagName } : {}),
            ...(photoId ? { photoId } : {}),
          }).toString()}`,
          { signal: controller.signal },
        )
        if (!storyRes.ok) {
          throw new Error(`tag-story ${storyRes.status}`)
        }
        const storyJson = await storyRes.json()
        const receivedStory: TagStory = storyJson.story
        setStoryState((prev) => ({ ...prev, story: receivedStory }))
        if (!hasTrackedViewRef.current) {
          recordTagStoryViewed(receivedStory, { photoId })
          hasTrackedViewRef.current = true
        }
        succeeded = true

        try {
          const recRes = await fetch(
            `/api/catalog/recommendations?${new URLSearchParams({
              context: 'story',
              ...(effectiveTagId ? { tagId: effectiveTagId } : {}),
              tag: receivedStory.tagName,
              ...(photoId ? { photoId } : {}),
            }).toString()}`,
            { signal: controller.signal },
          )
          if (recRes.ok) {
            const recJson = await recRes.json()
            const items: CatalogRecommendationItem[] = Array.isArray(recJson.recommendations) ? recJson.recommendations : []
            setStoryState({ story: recJson.story ?? receivedStory, recommendations: items })
          } else {
            setStoryState((prev) => ({ ...prev, recommendations: [] }))
          }
        } catch (recommendationError) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[TagStoryTooltip] recommendations fetch failed', recommendationError)
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return
        setError('暂时无法加载标签故事')
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[TagStoryTooltip] fetch failed', error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
        fetchStartedRef.current = succeeded
      }
    })()

    return () => {
      controller.abort()
      fetchStartedRef.current = succeeded
    }
  }, [open, effectiveTagId, tagName, photoId])

  const handlePrimaryAction = useCallback(() => {
    if (!story) return
    recordTagStoryCTA(story, { photoId, href: story.cta.href })
    onNavigate?.({ story })
    setOpen(false)
  }, [story, onNavigate, photoId])

  const handleRecommendationClick = useCallback(
    (item: CatalogRecommendationItem) => {
      if (!story) return
      recordTagStoryCTA(story, { photoId, href: item.href })
      onNavigate?.({ story, item })
      setOpen(false)
    },
    [story, onNavigate, photoId],
  )

  const badgeStyle = useMemo(() => {
    if (!accentColor) return undefined
    return {
      borderColor: `${accentColor}33`,
      backgroundColor: `${accentColor}1a`,
      color: accentColor,
    }
  }, [accentColor])

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <button
        type="button"
        className={cn(
          'rounded-full border border-contrast-outline/30 bg-contrast-surface/40 px-3 py-1 text-xs font-medium text-text-inverted/70 transition',
          'hover:bg-surface-panel/10 hover:text-text-inverted focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        )}
        style={badgeStyle}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        #{effectiveTagName}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full z-50 mt-3 w-72 max-w-xs rounded-2xl border border-contrast-outline/10 bg-contrast-surface/80 p-4 shadow-floating backdrop-blur-xl"
          >
            {loading ? (
              <div className="flex items-center gap-3 text-xs text-text-inverted/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载标签故事…
              </div>
            ) : error ? (
              <p className="text-xs text-red-300">{error}</p>
            ) : story ? (
              <div className="space-y-3 text-text-inverted">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-text-inverted/50">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  标签故事
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-text-inverted">#{story.tagName}</p>
                  <p className="text-xs leading-relaxed text-text-inverted/70">{story.summary}</p>
                  <p className="text-[11px] text-text-inverted/50">
                    {story.photoCount > 0
                      ? `收录 ${catalogNumberFormatter.format(story.photoCount)} 张作品`
                      : '尚无公开作品'}
                  </p>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-panel/90 px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface-panel"
                  onClick={handlePrimaryAction}
                >
                  <span>前往推荐</span>
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>

                {recommendations.length > 1 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-inverted/50">相关标签</p>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.slice(1).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="group inline-flex items-center gap-1 rounded-full border border-contrast-outline/20 px-3 py-1 text-[11px] text-text-inverted/70 transition hover:border-contrast-outline hover:bg-surface-panel/10 hover:text-text-inverted"
                          onClick={() => handleRecommendationClick(item)}
                          aria-label={`查看 ${item.title}`}
                        >
                          <LinkIcon className="h-3 w-3" aria-hidden />
                          <span>{item.title}</span>
                          {item.stats ? (
                            <span className="text-[10px] text-text-inverted/40 group-hover:text-text-inverted/60">{item.stats}</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-text-inverted/60">暂无该标签的额外故事信息。</p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
