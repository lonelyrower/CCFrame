'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  X, 
  Upload, 
  Eye, 
  EyeOff, 
  FolderOpen,
  ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function NewAlbumPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [albumData, setAlbumData] = useState({
    title: '',
    description: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
    coverPhotoId: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!albumData.title.trim()) {
      toast.error('请输入相册标题')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: albumData.title.trim(),
          description: albumData.description.trim() || undefined,
          visibility: albumData.visibility
        })
      })

      if (response.ok) {
        const album = await response.json()
        toast.success('相册创建成功')
        router.push(`/admin/albums/${album.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || '创建失败')
      }
    } catch (error) {
      console.error('Failed to create album:', error)
      toast.error('创建失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-canvas dark:bg-surface-canvas">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverted">
                新建相册
              </h1>
              <p className="text-text-secondary dark:text-text-muted mt-1">
                创建一个新的照片相册
              </p>
            </div>
            
            <button
              onClick={() => router.back()}
              className="p-2 text-text-muted hover:text-text-secondary hover:bg-surface-panel dark:hover:bg-surface-panel rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-surface-panel dark:bg-surface-panel rounded-xl border border-surface-outline/40 dark:border-surface-outline/70 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 相册标题 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">
                  相册标题 *
                </label>
                <input
                  type="text"
                  value={albumData.title}
                  onChange={(e) => setAlbumData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="为你的相册起个名字..."
                  maxLength={100}
                  className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted placeholder:text-text-muted dark:placeholder:text-text-muted"
                  required
                />
                <div className="text-xs text-text-muted dark:text-text-muted mt-1">
                  {albumData.title.length}/100
                </div>
              </div>

              {/* 相册描述 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">
                  相册描述
                </label>
                <textarea
                  value={albumData.description}
                  onChange={(e) => setAlbumData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="描述一下这个相册的内容..."
                  maxLength={500}
                  rows={4}
                  className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted placeholder:text-text-muted dark:placeholder:text-text-muted resize-none"
                />
                <div className="text-xs text-text-muted dark:text-text-muted mt-1">
                  {albumData.description.length}/500
                </div>
              </div>

              {/* 可见性设置 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-3">
                  可见性设置
                </label>
                <div className="space-y-3">
                  <div 
                    className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                      albumData.visibility === 'PUBLIC'
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        : 'border-surface-outline/40 hover:border-surface-outline/60 dark:border-surface-outline/70 dark:hover:border-surface-outline/70'
                    }`}
                    onClick={() => setAlbumData(prev => ({ ...prev, visibility: 'PUBLIC' }))}
                  >
                    <div className="flex items-start">
                      <div className="flex items-center h-5 mt-0.5">
                        <input
                          type="radio"
                          checked={albumData.visibility === 'PUBLIC'}
                          onChange={() => setAlbumData(prev => ({ ...prev, visibility: 'PUBLIC' }))}
                          className="h-4 w-4 text-blue-600 border-surface-outline/60 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 text-green-600 mr-2" />
                          <div className="text-sm font-medium text-text-primary dark:text-text-inverted">
                            公开相册
                          </div>
                        </div>
                        <div className="text-sm text-text-secondary dark:text-text-muted mt-1">
                          所有人都可以查看这个相册中的照片
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                      albumData.visibility === 'PRIVATE'
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        : 'border-surface-outline/40 hover:border-surface-outline/60 dark:border-surface-outline/70 dark:hover:border-surface-outline/70'
                    }`}
                    onClick={() => setAlbumData(prev => ({ ...prev, visibility: 'PRIVATE' }))}
                  >
                    <div className="flex items-start">
                      <div className="flex items-center h-5 mt-0.5">
                        <input
                          type="radio"
                          checked={albumData.visibility === 'PRIVATE'}
                          onChange={() => setAlbumData(prev => ({ ...prev, visibility: 'PRIVATE' }))}
                          className="h-4 w-4 text-blue-600 border-surface-outline/60 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <EyeOff className="w-4 h-4 text-orange-600 mr-2" />
                          <div className="text-sm font-medium text-text-primary dark:text-text-inverted">
                            私密相册
                          </div>
                        </div>
                        <div className="text-sm text-text-secondary dark:text-text-muted mt-1">
                          只有你可以查看这个相册中的照片
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 封面预览 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-3">
                  相册封面
                </label>
                <div className="border-2 border-dashed border-surface-outline/60 dark:border-surface-outline/70 rounded-lg p-8 text-center">
                  <FolderOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <div className="text-sm text-text-secondary dark:text-text-muted mb-2">
                    创建相册后，你可以设置封面照片
                  </div>
                  <div className="text-xs text-text-muted dark:text-text-muted">
                    支持从相册中的照片选择封面
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-surface-outline/40 dark:border-surface-outline/70">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-text-secondary dark:text-text-muted hover:text-text-primary dark:hover:text-text-inverted transition-colors"
                >
                  取消
                </button>
                
                <Button
                  type="submit"
                  disabled={isLoading || !albumData.title.trim()}
                  className="px-6"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-contrast-outline border-t-transparent rounded-full animate-spin mr-2" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      创建相册
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}