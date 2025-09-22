import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { photoTagsStore } from './photo-tags-store'

interface Tag { id: string; name: string; color?: string | null }

const PLACEHOLDER_ID = '__lightbox-placeholder__'

export function usePhotoTags(rawPhotoId: string | null | undefined, initial: Tag[]) {
  const effectiveId = rawPhotoId && rawPhotoId.length > 0 ? rawPhotoId : PLACEHOLDER_ID
  const isPlaceholder = effectiveId === PLACEHOLDER_ID

  const [tags, setTags] = useState<Tag[]>(() => {
    if (isPlaceholder) return initial
    const cached = photoTagsStore.get(effectiveId)
    return cached && cached.length ? cached : initial
  })
  const [editing, setEditing] = useState(false)
  const toggleEditing = () => setEditing((value) => !value)
  const busy = useRef(false)
  const currentAbort = useRef<AbortController | null>(null)

  useEffect(() => {
    if (isPlaceholder) {
      setTags(initial)
      return
    }

    const unsub = photoTagsStore.subscribe((pid, next) => {
      if (pid === effectiveId) setTags(next)
    })

    if (!photoTagsStore.get(effectiveId)) {
      photoTagsStore.set(effectiveId, initial)
    }

    return () => {
      unsub()
    }
  }, [effectiveId, initial, isPlaceholder])

  const addTag = useCallback(async (nameRaw: string) => {
    const name = nameRaw.trim()
    if (!name || isPlaceholder || busy.current) return

    const exists = tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase())
    if (exists) {
      toast.error('标签已存在')
      return
    }

    busy.current = true
    const temp: Tag = { id: `temp-${Date.now()}`, name, color: '#6b7280' }
    const rollback = tags
    photoTagsStore.update(effectiveId, (list) => [...list, temp])

    try {
      currentAbort.current?.abort()
      const ac = new AbortController()
      currentAbort.current = ac
      const res = await fetch(`/api/photos/${effectiveId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        signal: ac.signal,
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      photoTagsStore.update(effectiveId, (list) => list.map((tag) => (tag.id === temp.id ? data.tag : tag)))
      toast.success('标签已添加')
    } catch (error: any) {
      if (error?.name === 'AbortError') return
      photoTagsStore.set(effectiveId, rollback)
      toast.error('添加标签失败')
    } finally {
      busy.current = false
    }
  }, [effectiveId, isPlaceholder, tags])

  const removeTag = useCallback(async (tagId: string) => {
    if (isPlaceholder || busy.current) return
    busy.current = true
    const rollback = tags
    photoTagsStore.update(effectiveId, (list) => list.filter((item) => item.id !== tagId))

    try {
      currentAbort.current?.abort()
      const ac = new AbortController()
      currentAbort.current = ac
      const res = await fetch(`/api/photos/${effectiveId}/tags/${tagId}`, { method: 'DELETE', signal: ac.signal })
      if (!res.ok) throw new Error()
      toast.success('标签已移除')
    } catch (error: any) {
      if (error?.name === 'AbortError') return
      photoTagsStore.set(effectiveId, rollback)
      toast.error('移除标签失败')
    } finally {
      busy.current = false
    }
  }, [effectiveId, isPlaceholder, tags])

  return { tags, editing, toggleEditing, addTag, removeTag }
}

