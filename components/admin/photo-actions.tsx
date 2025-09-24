'use client'

import { useState } from 'react'
import { Eye, EyeOff, Trash2, Download, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import { PhotoWithDetails } from '@/types'
import { PhotoEditModal } from './photo-edit-modal'

export function PhotoActions({
  photo,
  photoId,
  visibility,
  onChanged,
}: {
  photo?: PhotoWithDetails
  photoId?: string
  visibility?: 'PUBLIC' | 'PRIVATE'
  onChanged?: (v: 'PUBLIC' | 'PRIVATE' | 'DELETED') => void
}) {
  const [busy, setBusy] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [fullPhoto, setFullPhoto] = useState<PhotoWithDetails | null>(photo || null)
  
  // Support both legacy and new props
  const id = photo?.id || photoId!
  const currentVisibility = photo?.visibility || visibility!
  const toggleVisibility = async () => {
    if (busy) return
    setBusy(true)
    try {
      const next = currentVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'
      const res = await fetch(`/api/photos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visibility: next }) })
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
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      toast.success('已删除')
      onChanged?.('DELETED')
    } catch (e: any) {
      toast.error(e?.message || '删除失败')
    } finally { setBusy(false) }
  }

  const download = () => {
    window.open(`/api/image/${id}/large?format=jpeg`, '_blank')
  }

  const handleEdit = async () => {
    if (fullPhoto) {
      setShowEditModal(true)
      return
    }

    // 如果没有完整的photo数据，先获取
    try {
      setBusy(true)
      const response = await fetch(`/api/photos/${id}`)
      if (!response.ok) {
        throw new Error('获取照片数据失败')
      }
      const { photo: photoData } = await response.json()
      setFullPhoto(photoData)
      setShowEditModal(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '获取照片数据失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex items-center gap-1 bg-contrast-surface/70 backdrop-blur-sm rounded-md p-1" role="toolbar" aria-label="照片操作">
          <button
            className="p-1.5 text-text-inverted hover:bg-surface-panel/20 rounded transition-colors"
            title="编辑"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              handleEdit()
            }}
            disabled={busy}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-text-inverted hover:bg-surface-panel/20 rounded transition-colors"
            title={currentVisibility === 'PUBLIC' ? '设为私密' : '设为公开'}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              toggleVisibility()
            }}
            disabled={busy}
          >
            {currentVisibility === 'PUBLIC' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            className="p-1.5 text-text-inverted hover:bg-surface-panel/20 rounded transition-colors"
            title="下载"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              download()
            }}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-text-inverted hover:bg-red-600 rounded transition-colors"
            title="删除"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              del()
            }}
            disabled={busy}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {fullPhoto && (
        <PhotoEditModal
          photo={fullPhoto}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updatedPhoto) => {
            setFullPhoto(updatedPhoto)
            onChanged?.(updatedPhoto.visibility as 'PUBLIC' | 'PRIVATE' | 'DELETED')
          }}
        />
      )}
    </>
  )
}

