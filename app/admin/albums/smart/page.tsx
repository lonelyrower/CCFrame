'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

type SmartAlbum = { id: string; title: string; description?: string | null; visibility: 'PUBLIC' | 'PRIVATE'; coverPhotoId?: string | null }

type Rule = {
  tagsAny?: string[]
  tagsAll?: string[]
  tagsNone?: string[]
  visibility?: 'PUBLIC' | 'PRIVATE' | 'ANY'
  dateRange?: { from?: string; to?: string }
}

export default function SmartAlbumsPage() {
  const [albums, setAlbums] = useState<SmartAlbum[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{ id: string; title: string; coverPhotoId?: string } | null>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [edit, setEdit] = useState<{ id: string; title: string; description: string; rule: Rule; visibility: 'PUBLIC'|'PRIVATE' } | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<{ title: string; description: string; rule: Rule }>({ title: '', description: '', rule: { visibility: 'ANY' } })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/smart-albums?withCounts=1')
      const data = await res.json()
      setAlbums(data.albums || [])
    } catch (e) {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const openPreview = async (id: string, title: string) => {
    setModal({ id, title })
    try {
      const res = await fetch(`/api/admin/smart-albums/${id}/photos?limit=50`)
      const data = await res.json()
      setPhotos(data.photos || [])
    } catch {
      toast.error('加载照片失败')
    }
  }

  const loadOne = async (id: string) => {
    const r = await fetch(`/api/admin/smart-albums/${id}`)
    if (!r.ok) return null
    const d = await r.json()
    return d.album as any
  }

  const openEdit = async (id: string) => {
    const a = await loadOne(id)
    if (!a) return toast.error('加载失败')
    setEdit({ id: a.id, title: a.title, description: a.description || '', rule: a.ruleJson || {}, visibility: a.visibility })
  }

  const saveEdit = async () => {
    if (!edit) return
    try {
      const res = await fetch(`/api/admin/smart-albums/${edit.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: edit.title, description: edit.description, rule: edit.rule, visibility: edit.visibility }) })
      if (!res.ok) throw new Error('保存失败')
      toast.success('已保存')
      setEdit(null)
      load()
    } catch (e: any) {
      toast.error(e?.message || '保存失败')
    }
  }

  const setCover = async (albumId: string, photoId: string) => {
    try {
      const res = await fetch(`/api/admin/smart-albums/${albumId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coverPhotoId: photoId }) })
      if (!res.ok) throw new Error('设置封面失败')
      toast.success('已设置封面')
      setModal(null)
      load()
    } catch (e: any) {
      toast.error(e?.message || '设置封面失败')
    }
  }

  const create = async () => {
    if (!form.title.trim()) return toast.error('请输入标题')
    setCreating(true)
    try {
      const res = await fetch('/api/admin/smart-albums', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('创建失败')
      toast.success('已创建智能相册')
      setForm({ title: '', description: '', rule: { visibility: 'ANY' } })
      load()
    } catch (e: any) {
      toast.error(e?.message || '创建失败')
    } finally { setCreating(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('删除该智能相册？')) return
    try {
      const res = await fetch(`/api/admin/smart-albums/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      toast.success('已删除')
      load()
    } catch (e: any) {
      toast.error(e?.message || '删除失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">智能相册</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">根据标签/时间/可见性自动聚合照片</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-3">创建智能相册</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="标题" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="px-3 py-2 border rounded" />
            <input placeholder="描述（可选）" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="px-3 py-2 border rounded" />
            <select value={form.rule.visibility || 'ANY'} onChange={(e) => setForm(f => ({ ...f, rule: { ...f.rule, visibility: e.target.value as any } }))} className="px-3 py-2 border rounded">
              <option value="ANY">不限可见性</option>
              <option value="PUBLIC">仅公开</option>
              <option value="PRIVATE">仅私密</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <input placeholder="至少包含任一标签（用逗号分隔）" value={(form.rule.tagsAny || []).join(',')} onChange={(e) => setForm(f => ({ ...f, rule: { ...f.rule, tagsAny: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))} className="px-3 py-2 border rounded" />
            <input placeholder="必须包含全部标签（用逗号分隔）" value={(form.rule.tagsAll || []).join(',')} onChange={(e) => setForm(f => ({ ...f, rule: { ...f.rule, tagsAll: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))} className="px-3 py-2 border rounded" />
            <input placeholder="排除标签（用逗号分隔）" value={(form.rule.tagsNone || []).join(',')} onChange={(e) => setForm(f => ({ ...f, rule: { ...f.rule, tagsNone: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))} className="px-3 py-2 border rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <input type="date" value={form.rule.dateRange?.from || ''} onChange={(e) => setForm(f => ({ ...f, rule: { ...f.rule, dateRange: { ...(f.rule.dateRange || {}), from: e.target.value || undefined } } }))} className="px-3 py-2 border rounded" />
            <input type="date" value={form.rule.dateRange?.to || ''} onChange={(e) => setForm(f => ({ ...f, rule: { ...f.rule, dateRange: { ...(f.rule.dateRange || {}), to: e.target.value || undefined } } }))} className="px-3 py-2 border rounded" />
          </div>
          <div className="flex justify-end mt-3">
            <Button onClick={create} disabled={creating}>{creating ? '创建中...' : '创建'}</Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="font-semibold mb-3">我的智能相册</h2>
          {albums.length === 0 ? (
            <div className="text-gray-500">暂无智能相册</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {albums.map(a => (
                <div key={a.id} className="border rounded p-3 flex items-center justify-between gap-3">
                  <div className="w-20 h-14 rounded overflow-hidden bg-gray-100 hidden sm:block">
                    {a.coverPhotoId ? (
                      <img src={`/api/image/${a.coverPhotoId}/thumb?format=webp`} alt={`Cover photo for smart album ${a.title}`} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-gray-500">{a.description || '—'}</div>
                    {'_count' in a && (a as any)._count?.photos !== undefined && (
                      <div className="text-xs text-gray-400">匹配照片：{(a as any)._count.photos}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openPreview(a.id, a.title)}>预览</Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(a.id)}>编辑</Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      const src = await loadOne(a.id)
                      if (!src) return
                      const res = await fetch('/api/admin/smart-albums', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `复制 - ${src.title}`, description: src.description, rule: src.ruleJson }) })
                      if (!res.ok) return toast.error('复制失败')
                      toast.success('已复制智能相册')
                      load()
                    }}>复制</Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(a.id)}>删除</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {modal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl rounded-xl p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{modal.title} - 预览</h3>
                <Button variant="ghost" onClick={() => setModal(null)}>关闭</Button>
              </div>
              {photos.length === 0 ? (
                <div className="text-gray-500">暂无匹配照片</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[70vh] overflow-auto">
                  {photos.map((p: any) => (
                    <div key={p.id} className="relative group">
                      <img src={`/api/image/${p.id}/small?format=webp`} alt={`Photo preview for smart album`} className="w-full h-auto rounded" />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                        <Button size="sm" onClick={() => setCover(modal!.id, p.id)}>设为封面</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {edit && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEdit(null)}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-xl p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">编辑智能相册</h3>
                <Button variant="ghost" onClick={() => setEdit(null)}>关闭</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className="px-3 py-2 border rounded" />
                <input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className="px-3 py-2 border rounded" />
                <select value={edit.visibility} onChange={(e) => setEdit({ ...edit, visibility: e.target.value as any })} className="px-3 py-2 border rounded">
                  <option value="PRIVATE">私密</option>
                  <option value="PUBLIC">公开</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <input placeholder="任一标签" value={(edit.rule.tagsAny || []).join(',')} onChange={(e) => setEdit({ ...edit, rule: { ...edit.rule, tagsAny: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} className="px-3 py-2 border rounded" />
                <input placeholder="全部标签" value={(edit.rule.tagsAll || []).join(',')} onChange={(e) => setEdit({ ...edit, rule: { ...edit.rule, tagsAll: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} className="px-3 py-2 border rounded" />
                <input placeholder="排除标签" value={(edit.rule.tagsNone || []).join(',')} onChange={(e) => setEdit({ ...edit, rule: { ...edit.rule, tagsNone: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} className="px-3 py-2 border rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <input type="date" value={edit.rule.dateRange?.from || ''} onChange={(e) => setEdit({ ...edit, rule: { ...edit.rule, dateRange: { ...(edit.rule.dateRange || {}), from: e.target.value || undefined } } })} className="px-3 py-2 border rounded" />
                <input type="date" value={edit.rule.dateRange?.to || ''} onChange={(e) => setEdit({ ...edit, rule: { ...edit.rule, dateRange: { ...(edit.rule.dateRange || {}), to: e.target.value || undefined } } })} className="px-3 py-2 border rounded" />
              </div>
              <div className="flex justify-end mt-3">
                <Button onClick={saveEdit}>保存</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
