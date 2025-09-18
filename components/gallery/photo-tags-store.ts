type Tag = { id: string; name: string; color?: string | null }

interface Entry { photoId: string; tags: Tag[] }

type Listener = (photoId: string, tags: Tag[]) => void

class PhotoTagsStore {
  private map = new Map<string, Tag[]>()
  private listeners = new Set<Listener>()

  get(photoId: string) {
    return this.map.get(photoId)
  }
  set(photoId: string, tags: Tag[]) {
    this.map.set(photoId, tags)
    this.emit(photoId)
  }
  update(photoId: string, fn: (prev: Tag[]) => Tag[]) {
    const prev = this.map.get(photoId) || []
    const next = fn(prev)
    this.map.set(photoId, next)
    this.emit(photoId)
  }
  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  clear() {
    this.map.clear()
  }
  getTopTags(limit = 5, excludeNames: string[] = []) {
    const exclude = new Set(excludeNames.map(name => name.toLowerCase()))
    const tally = new Map<string, { tag: Tag; count: number }>()
    this.map.forEach(list => {
      list.forEach(tag => {
        const key = tag.name.toLowerCase()
        if (exclude.has(key)) return
        const existing = tally.get(key)
        if (existing) {
          existing.count += 1
        } else {
          tally.set(key, { tag, count: 1 })
        }
      })
    })
    return Array.from(tally.values())
      .sort((a, b) => b.count - a.count || a.tag.name.localeCompare(b.tag.name))
      .slice(0, Math.max(0, limit))
      .map(entry => ({ ...entry.tag }))
  }
  private emit(photoId: string) {
    const tags = this.map.get(photoId) || []
    Array.from(this.listeners).forEach(l => l(photoId, tags))
  }
}

export const photoTagsStore = new PhotoTagsStore()
