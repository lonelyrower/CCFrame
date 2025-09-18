import { useCallback, useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { photoTagsStore } from './photo-tags-store'

interface Tag { id: string; name: string; color?: string | null }

export function usePhotoTags(photoId: string, initial: Tag[]) {
  const [tags, setTags] = useState<Tag[]>(() => photoTagsStore.get(photoId) || initial)
  const [editing, setEditing] = useState(false)
  const toggleEditing = () => setEditing(e => !e)
  const busy = useRef(false)
  const currentAbort = useRef<AbortController | null>(null)

  // subscribe to external updates
  useEffect(() => {
    const unsub = photoTagsStore.subscribe((pid, next) => {
      if (pid === photoId) setTags(next)
    })
    if (!photoTagsStore.get(photoId)) photoTagsStore.set(photoId, initial)
    return () => { unsub() }
  }, [photoId, initial])

  const addTag = useCallback(async (nameRaw: string) => {
    const name = nameRaw.trim(); if (!name) return
    if (busy.current) return
    // duplicate (case-insensitive) prevention
    const exists = tags.some(t => t.name.toLowerCase() === name.toLowerCase())
    if (exists) {
      toast.error('标签已存在')
      return
    }
    busy.current = true
    const temp: Tag = { id: `temp-${Date.now()}`, name, color: '#6b7280' }
    const rollback = tags
    photoTagsStore.update(photoId, list => [...list, temp])
    try {
      currentAbort.current?.abort()
      const ac = new AbortController(); currentAbort.current = ac
      const res = await fetch(`/api/photos/${photoId}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }), signal: ac.signal })
      if (!res.ok) throw new Error()
      const data = await res.json()
      photoTagsStore.update(photoId, list => list.map(t => t.id === temp.id ? data.tag : t))
      toast.success('标签已添加')
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      photoTagsStore.set(photoId, rollback)
      toast.error('添加标签失败')
    } finally {
      busy.current = false
    }
  }, [photoId, tags])

  const removeTag = useCallback(async (tagId: string) => {
    if (busy.current) return
    busy.current = true
    const rollback = tags
    photoTagsStore.update(photoId, list => list.filter(x => x.id !== tagId))
    try {
      currentAbort.current?.abort()
      const ac = new AbortController(); currentAbort.current = ac
      const res = await fetch(`/api/photos/${photoId}/tags/${tagId}`, { method: 'DELETE', signal: ac.signal })
      if (!res.ok) throw new Error()
      toast.success('标签已移除')
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      photoTagsStore.set(photoId, rollback)
      toast.error('移除标签失败')
    } finally {
      busy.current = false
    }
  }, [photoId, tags])

  return { tags, editing, toggleEditing, addTag, removeTag }
}