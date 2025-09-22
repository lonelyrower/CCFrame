import type { TagStory } from '@/types/lightbox'

const ENDPOINT = '/api/lightbox/events'

interface StoryEventBase {
  event: string
  tagId: string
  tagName: string
  photoId?: string
  extra?: Record<string, unknown>
}

function sendStoryEvent(payload: StoryEventBase) {
  if (typeof window === 'undefined') return

  const body = JSON.stringify({ ...payload, createdAt: new Date().toISOString() })

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(ENDPOINT, blob)
    } else {
      void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      })
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[story-events] failed to capture event', error)
    }
  }
}

export function recordTagStoryViewed(tagStory: TagStory, options?: { photoId?: string }) {
  sendStoryEvent({
    event: 'tag_story_viewed',
    tagId: tagStory.tagId,
    tagName: tagStory.tagName,
    photoId: options?.photoId,
  })
}

export function recordTagStoryCTA(tagStory: TagStory, options?: { photoId?: string; href?: string }) {
  sendStoryEvent({
    event: 'tag_story_cta',
    tagId: tagStory.tagId,
    tagName: tagStory.tagName,
    photoId: options?.photoId,
    extra: options?.href ? { href: options.href } : undefined,
  })
}

export function recordTagStoryDismissed(tagStory: TagStory, options?: { photoId?: string }) {
  sendStoryEvent({
    event: 'tag_story_dismissed',
    tagId: tagStory.tagId,
    tagName: tagStory.tagName,
    photoId: options?.photoId,
  })
}
