"use client"

import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { PhotoWithDetails } from '@/types'

interface PhotoEditModalProps {
  photo: PhotoWithDetails
  isOpen: boolean
  onClose: () => void
  onUpdated?: (photo: PhotoWithDetails) => void
}

export function PhotoEditModal({ photo, isOpen, onClose, onUpdated }: PhotoEditModalProps) {
  const [visibility, setVisibility] = useState(photo.visibility)
  const [albumId, setAlbumId] = useState(photo.albumId || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visibility,
          albumId: albumId.trim() || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '保存失败')
      }

      const { photo: updatedPhoto } = await response.json()
      toast.success('照片已更新')
      onUpdated?.(updatedPhoto)
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            编辑照片
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              可见性
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="PUBLIC">公开</option>
              <option value="PRIVATE">私有</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              相册ID（可选）
            </label>
            <input
              type="text"
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
              placeholder="输入相册ID..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              留空则不分配到任何相册
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}