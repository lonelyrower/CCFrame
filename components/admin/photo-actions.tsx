'use client'

import { useState } from 'react'
import { Eye, EyeOff, Trash2, Download, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

export function PhotoActions({
  photoId,
  visibility,
  onChanged,
}: {
  photoId: string
  visibility: 'PUBLIC' | 'PRIVATE'
  onChanged?: (v: 'PUBLIC' | 'PRIVATE' | 'DELETED') => void
}) {
  const [busy, setBusy] = useState(false)
  const toggleVisibility = async () => {
    if (busy) return
    setBusy(true)
    try {
      const next = visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'
      const res = await fetch(`/api/photos/${photoId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visibility: next }) })
      if (!res.ok) throw new Error('更新失败')
      toast.success(next === 'PUBLIC' ? '已设为公开' : '已设为私密')
      onChanged?.(next)
    } catch (e: any) {
      toast.error(e?.message || '更新失败')
    } finally { setBusy(false) }
  }

  const del = async () => {
    if (busy) return
    if (!confirm('确定删除该照片及其所有版本？此操作不可撤销。')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      toast.success('已删除')
      onChanged?.('DELETED')
    } catch (e: any) {
      toast.error(e?.message || '删除失败')
    } finally { setBusy(false) }
  }

  const download = () => {
    window.open(`/api/image/${photoId}/large?format=jpeg`, '_blank')
  }

  return (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-1 bg-black/50 rounded-md p-1">
        <button className="p-1 text-white hover:bg-white/20 rounded" title="编辑" disabled>
          <Edit className="w-4 h-4" />
        </button>
        <button className="p-1 text-white hover:bg-white/20 rounded" title={visibility === 'PUBLIC' ? '设为私密' : '设为公开'} onClick={toggleVisibility} disabled={busy}>
          {visibility === 'PUBLIC' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button className="p-1 text-white hover:bg-white/20 rounded" title="下载" onClick={download}>
          <Download className="w-4 h-4" />
        </button>
        <button className="p-1 text-white hover:bg-red-600 rounded" title="删除" onClick={del} disabled={busy}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

