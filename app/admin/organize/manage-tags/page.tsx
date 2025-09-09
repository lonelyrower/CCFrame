'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

type Tag = { id: string; name: string; color: string; _count?: { photos: number } }

export default function ManageTagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<Tag | null>(null)
  const [targetId, setTargetId] = useState<string>('')
  const [affected, setAffected] = useState<number | null>(null)
  const [colorTouched, setColorTouched] = useState(false)
  const [sampleIds, setSampleIds] = useState<string[]>([])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tags
    return tags.filter(t => t.name.toLowerCase().includes(q))
  }, [query, tags])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tags')
      const data = await res.json()
      setTags(data.tags || [])
    } catch (e) {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const saveEdit = async () => {
    if (!editing) return
    try {
      const res = await fetch(`/api/admin/tags/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editing.name, color: editing.color })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '保存失败')
      }
      toast.success('已保存')
      setEditing(null)
      load()
    } catch (e: any) {
      toast.error(e?.message || '保存失败')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('确定删除该标签？与照片的关联将被移除。')) return
    try {
      const res = await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      toast.success('已删除')
      load()
    } catch (e: any) {
      toast.error(e?.message || '删除失败')
    }
  }

  const merge = async () => {
    if (!targetId || selected.length === 0) return
    if (!confirm(`确定合并 ${selected.length} 个标签到目标标签？此操作不可撤销。`)) return
    try {
      const res = await fetch('/api/admin/tags/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, sourceIds: selected })
      })
      if (!res.ok) throw new Error('合并失败')
      toast.success('已合并')
      setSelected([])
      setTargetId('')
      load()
    } catch (e: any) {
      toast.error(e?.message || '合并失败')
    }
  }

  useEffect(() => {
    if (selected.length === 0) { setAffected(null); return }
    const qs = new URLSearchParams({ sourceIds: selected.join(',') }).toString()
    fetch(`/api/admin/tags/preview-merge?${qs}`)
      .then(r => r.json())
      .then(d => setAffected(d.affected || 0))
      .catch(() => setAffected(null))
    fetch(`/api/admin/tags/preview-merge/photos?${qs}&limit=12`)
      .then(r => r.json())
      .then(d => setSampleIds(d.photos || []))
      .catch(() => setSampleIds([]))
  }, [selected])

  const suggestColor = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('红')) return '#ef4444'
    if (n.includes('橙') || n.includes('黄')) return '#f59e0b'
    if (n.includes('绿')) return '#22c55e'
    if (n.includes('青')) return '#06b6d4'
    if (n.includes('蓝')) return '#3b82f6'
    if (n.includes('紫')) return '#8b5cf6'
    if (n.includes('粉')) return '#ec4899'
    if (/[bw灰黑白]/.test(n)) return '#6b7280'
    return '#6b7280'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">标签管理</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">重命名、改颜色、合并或删除标签</p>
          </div>
          <div className="flex items-center gap-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索标签" className="px-3 py-2 border rounded" />
            <Button onClick={load} disabled={loading}>{loading ? '加载中...' : '刷新'}</Button>
          </div>
          {affected !== null && (
            <span className="text-sm text-gray-500">预计影响照片数：{affected}</span>
          )}
        </div>

        {sampleIds.length > 0 && (
          <div className="mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">受影响照片样例</div>
            <div className="grid grid-cols-6 gap-2">
              {sampleIds.map(id => (
                <img key={id} src={`/api/image/${id}/thumb?format=webp`} className="w-full h-auto rounded" />
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(tag => (
              <div key={tag.id} className="border rounded p-3 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.includes(tag.id)} onChange={() => toggle(tag.id)} />
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: tag.color }} />
                    <span className="font-medium">{tag.name}</span>
                    <span className="text-xs text-gray-500">({tag._count?.photos || 0})</span>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setColorTouched(false); setEditing(tag) }}>编辑</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(tag.id)}>删除</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
          <span className="text-sm">合并所选标签 到</span>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="px-3 py-2 border rounded">
            <option value="">选择目标标签</option>
            {tags.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
          <Button onClick={merge} disabled={!targetId || selected.length === 0}>执行合并</Button>
          {/* affected preview placeholder; will be inserted above */}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl p-4 space-y-3">
              <h3 className="text-lg font-semibold">编辑标签</h3>
              <div>
                <label className="block text-sm mb-1">名称</label>
                <input value={editing.name} onChange={(e) => {
                  const newName = e.target.value
                  setEditing(prev => {
                    if (!prev) return prev
                    const next = { ...prev, name: newName }
                    if (!colorTouched) next.color = suggestColor(newName)
                    return next
                  })
                }} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm mb-1">颜色</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={editing.color} onChange={(e) => { setColorTouched(true); setEditing({ ...editing, color: e.target.value }) }} />
                  <input value={editing.color} onChange={(e) => { setColorTouched(true); setEditing({ ...editing, color: e.target.value }) }} className="flex-1 px-3 py-2 border rounded" />
          {affected !== null && (
            <span className="text-sm text-gray-500">预计影响照片数：{affected}</span>
          )}
        </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>取消</Button>
                <Button onClick={saveEdit}>保存</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
