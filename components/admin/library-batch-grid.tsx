'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PhotoTagsInline } from '@/components/admin/photo-tags-inline'
import { PhotoActions } from '@/components/admin/photo-actions'

type Tag = { id: string; name: string; color: string }
type PhotoItem = { id: string; visibility: 'PUBLIC' | 'PRIVATE'; width: number; height: number; albumTitle?: string | null; tags: Tag[] }

export function LibraryBatchGrid({ initial }: { initial: PhotoItem[] }) {
  const [items, setItems] = useState<PhotoItem[]>(initial)
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [addingTag, setAddingTag] = useState('')
  const [removingTag, setRemovingTag] = useState('')
  const [albums, setAlbums] = useState<{ id: string; title: string }[]>([])
  const [targetAlbum, setTargetAlbum] = useState<string>('')
  const selectedIds = useMemo(() => Object.keys(sel).filter(id => sel[id]), [sel])

  const toggle = (id: string) => setSel(s => ({ ...s, [id]: !s[id] }))
  const selectAll = () => setSel(Object.fromEntries(items.map(i => [i.id, true])))
  const clearSel = () => setSel({})

  const batchVisibility = async (visibility: 'PUBLIC' | 'PRIVATE') => {
    const ids = selectedIds
    for (const id of ids) {
      try { await fetch(`/api/photos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visibility }) }) } catch {}
    }
    setItems(arr => arr.map(x => (sel[x.id] ? { ...x, visibility } : x)))
  }

  const batchDelete = async () => {
    const ids = selectedIds
    if (ids.length === 0) return
    if (!confirm(`确定删除 ${ids.length} 张照片？此操作不可撤销。`)) return
    for (const id of ids) {
      try { await fetch(`/api/photos/${id}`, { method: 'DELETE' }) } catch {}
    }
    setItems(arr => arr.filter(x => !sel[x.id]))
    clearSel()
  }

  const batchAddTag = async () => {
    const name = addingTag.trim()
    if (!name) return
    const ids = selectedIds
    for (const id of ids) {
      try { await fetch(`/api/admin/photos/${id}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }) } catch {}
    }
    setAddingTag('')
  }

  const batchRemoveTag = async () => {
    const name = removingTag.trim()
    if (!name) return
    // resolve tag id from name
    let tagId = ''
    try {
      const r = await fetch(`/api/admin/tags?q=${encodeURIComponent(name)}&limit=1`)
      const d = await r.json()
      const t = (d.tags || [])[0]
      if (!t) return
      tagId = t.id
    } catch {}
    if (!tagId) return
    const ids = selectedIds
    for (const id of ids) {
      try { await fetch(`/api/admin/photos/${id}/tags?tagId=${encodeURIComponent(tagId)}`, { method: 'DELETE' }) } catch {}
    }
    setRemovingTag('')
  }

  const batchMoveToAlbum = async () => {
    const ids = selectedIds
    const payload = targetAlbum ? { albumId: targetAlbum } : { albumId: null }
    for (const id of ids) {
      try { await fetch(`/api/photos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }) } catch {}
    }
    // UI: nothing else to change here except maybe albumTitle, which we don't track beyond display
  }

  useEffect(() => {
    fetch('/api/albums')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : (d.albums || [])
        setAlbums(list.map((a: any) => ({ id: a.id, title: a.title })))
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600 dark:text-gray-300">已选择 {selectedIds.length} 张</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>全选</Button>
          <Button variant="outline" size="sm" onClick={clearSel}>清空</Button>
          <Button size="sm" onClick={() => batchVisibility('PUBLIC')}>设为公开</Button>
          <Button size="sm" onClick={() => batchVisibility('PRIVATE')}>设为私密</Button>
          <div className="flex items-center gap-2">
            <input value={addingTag} onChange={(e) => setAddingTag(e.target.value)} placeholder="批量添加标签" className="px-2 py-1 border rounded text-sm" />
            <Button size="sm" onClick={batchAddTag}>添加</Button>
          </div>
          <div className="flex items-center gap-2">
            <input value={removingTag} onChange={(e) => setRemovingTag(e.target.value)} placeholder="批量移除标签（按名称）" className="px-2 py-1 border rounded text-sm" />
            <Button size="sm" onClick={batchRemoveTag}>移除</Button>
          </div>
          <div className="flex items-center gap-2">
            <select value={targetAlbum} onChange={(e) => setTargetAlbum(e.target.value)} className="px-2 py-1 border rounded text-sm">
              <option value="">移出相册</option>
              {albums.map(a => (<option key={a.id} value={a.id}>{a.title}</option>))}
            </select>
            <Button size="sm" onClick={batchMoveToAlbum}>移动</Button>
          </div>
          <div className="flex items-center gap-2">
            <input id="newAlbumTitle" placeholder="新建相册标题" className="px-2 py-1 border rounded text-sm" />
            <Button size="sm" onClick={async () => {
              const input = document.getElementById('newAlbumTitle') as HTMLInputElement | null
              const title = (input?.value || '').trim()
              if (!title) return
              try {
                const res = await fetch('/api/albums', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, visibility: 'PRIVATE' }) })
                if (!res.ok) throw new Error('创建失败')
                const album = await res.json()
                setAlbums(list => [...list, { id: album.id, title: album.title }])
                setTargetAlbum(album.id)
                input!.value = ''
              } catch {}
            }}>新建+选择</Button>
          </div>
          <Button variant="destructive" size="sm" onClick={batchDelete}>批量删除</Button>
          <Button size="sm" variant="outline" onClick={async () => {
            const ids = selectedIds
            if (ids.length === 0) return
            try {
              const res = await fetch('/api/admin/photos/export-links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, variant: 'large', format: 'jpeg' }) })
              if (!res.ok) throw new Error('导出失败')
              const text = await res.text()
              const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `export_links_${Date.now()}.txt`
              a.click()
              URL.revokeObjectURL(url)
            } catch {}
          }}>导出链接清单</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map(photo => (
          <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img src={`/api/image/${photo.id}/small`} alt={photo.albumTitle || 'Photo'} className="w-full h-full object-cover transition-transform group-hover:scale-105" />

            <PhotoActions photoId={photo.id} visibility={photo.visibility} onChanged={(v) => {
              if (v === 'DELETED') setItems(arr => arr.filter(x => x.id !== photo.id))
              else setItems(arr => arr.map(x => x.id === photo.id ? { ...x, visibility: v } : x))
            }} />

            <label className="absolute top-2 left-2 bg-black/40 text-white rounded px-2 py-1 text-xs cursor-pointer flex items-center gap-1">
              <input type="checkbox" className="w-3 h-3" checked={!!sel[photo.id]} onChange={() => toggle(photo.id)} />
              选择
            </label>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="text-white text-sm">
                {photo.albumTitle && (<div className="font-medium mb-1">{photo.albumTitle}</div>)}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs ${photo.visibility === 'PUBLIC' ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'}`}>{photo.visibility === 'PUBLIC' ? '公开' : '私密'}</div>
                  </div>
                  <div className="text-xs opacity-75">{photo.width} × {photo.height}</div>
                </div>
                <PhotoTagsInline photoId={photo.id} initial={photo.tags} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
