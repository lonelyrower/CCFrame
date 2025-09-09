'use client'

import { useState, useEffect } from 'react'
import { 
  Wand2, 
  Upload, 
  Zap, 
  Sparkles, 
  Palette,
  ArrowUpRight,
  Download,
  Share2,
  RotateCcw,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageComparison } from '@/components/ai/image-comparison'
import { CleanupEditor } from '@/components/ai/cleanup-editor'
import toast from 'react-hot-toast'

interface Photo {
  id: string
  fileKey: string
  width: number
  height: number
  album?: {
    title: string
  }
}

interface AITask {
  id: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  progress: number
  result?: any
  error?: string
}

const AI_TASKS = [
  {
    id: 'enhance',
    name: 'AI增强',
    description: '自动优化亮度、对比度、清晰度',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
    params: {
      autoFix: true,
      brightness: 10,
      contrast: 15,
      sharpness: 0.5
    }
  },
  {
    id: 'upscale',
    name: 'AI放大',
    description: '无损放大图片，提升分辨率',
    icon: ArrowUpRight,
    color: 'from-green-500 to-emerald-500',
    params: {
      scale: 2
    }
  },
  {
    id: 'remove-background',
    name: '去背景',
    description: '智能移除图片背景',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    params: {}
  },
  {
    id: 'style-transfer',
    name: '风格转换',
    description: '应用艺术风格滤镜',
    icon: Palette,
    color: 'from-orange-500 to-red-500',
    params: {
      style: 'artistic'
    }
  }
]

export default function AIEnhancePage() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [currentTask, setCurrentTask] = useState<AITask | null>(null)
  const [resultImages, setResultImages] = useState<{
    original: string
    enhanced: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCleanup, setShowCleanup] = useState(false)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos?limit=50')
      if (response.ok) {
        const data = await response.json()
        setPhotos(data.photos || [])
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    }
  }

  const handlePhotoSelect = (photo: Photo) => {
    setSelectedPhoto(photo)
    setCurrentTask(null)
    setResultImages(null)
  }

  const startAITask = async (taskType: string, params: Record<string, any>) => {
    if (!selectedPhoto) return

    setLoading(true)
    try {
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          photoId: selectedPhoto.id,
          taskType,
          params,
          provider: 'auto'
        })
      })

      if (response.ok) {
        const result = await response.json()
        setCurrentTask({ id: result.jobId, status: 'PENDING', progress: 0 })
        toast.success('AI处理任务已启动')
        
        // 开始轮询任务状态
        pollTaskStatus(result.jobId)
      } else {
        const error = await response.json()
        toast.error(error.error || 'AI处理启动失败')
      }
    } catch (error) {
      console.error('AI task error:', error)
      toast.error('AI处理启动失败')
    } finally {
      setLoading(false)
    }
  }

  const pollTaskStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/ai/enhance?jobId=${jobId}`)
        if (response.ok) {
          const task = await response.json()
          setCurrentTask(task)
          
          if (task.status === 'COMPLETED' && task.result) {
            // 获取对比图片（编辑版本通过 /api/edit/:id 提供）
            const originalUrl = `/api/image/${selectedPhoto!.id}/medium`
            const enhancedUrl = task.result.editVersionId ? `/api/edit/${task.result.editVersionId}` : `/api/image/${selectedPhoto!.id}/medium`
            
            setResultImages({
              original: originalUrl,
              enhanced: enhancedUrl
            })
            toast.success('AI处理完成！')
            return
          } else if (task.status === 'FAILED') {
            toast.error(task.error || 'AI处理失败')
            return
          }
          
          // 继续轮询
          setTimeout(poll, 2000)
        }
      } catch (error) {
        console.error('Poll error:', error)
        setTimeout(poll, 3000) // 出错时延长轮询间隔
      }
    }
    
    poll()
  }

  const downloadResult = () => {
    if (resultImages?.enhanced) {
      const link = document.createElement('a')
      link.href = resultImages.enhanced
      link.download = `enhanced_${selectedPhoto?.id}.jpg`
      link.click()
    }
  }

  const resetTask = () => {
    setCurrentTask(null)
    setResultImages(null)
  }

  const startCleanup = async (maskDataUrl: string) => {
    if (!selectedPhoto) return
    setLoading(true)
    try {
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: selectedPhoto.id, taskType: 'cleanup', params: {}, mask: maskDataUrl })
      })
      if (response.ok) {
        const result = await response.json()
        setCurrentTask({ id: result.jobId, status: 'PENDING', progress: 0 })
        toast.success('AI清理任务已启动')
        setShowCleanup(false)
        pollTaskStatus(result.jobId)
      } else {
        const err = await response.json().catch(() => ({}))
        toast.error(err.error || 'AI清理启动失败')
      }
    } catch (e) {
      console.error('Cleanup error:', e)
      toast.error('AI清理启动失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Wand2 className="w-8 h-8 text-blue-600" />
            AI智能修图
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            选择照片并使用AI技术进行智能增强处理
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：照片选择 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  选择照片
                </h2>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                {photos.length === 0 ? (
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      暂无可用照片
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map(photo => (
                      <div
                        key={photo.id}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                          selectedPhoto?.id === photo.id
                            ? 'ring-2 ring-blue-500 scale-95'
                            : 'hover:scale-105'
                        }`}
                        onClick={() => handlePhotoSelect(photo)}
                      >
                        <img
                          src={`/api/image/${photo.id}/small`}
                          alt={photo.album?.title || 'Photo'}
                          className="w-full h-full object-cover"
                        />
                        {selectedPhoto?.id === photo.id && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-blue-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：AI功能和结果 */}
          <div className="lg:col-span-2">
            {!selectedPhoto ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <Wand2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  选择一张照片开始AI修图
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  从左侧选择一张照片，然后选择AI处理方式
                </p>
              </div>
            ) : resultImages ? (
              // 显示对比结果
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI修图结果
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetTask}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重新处理
                    </Button>
                    <Button onClick={downloadResult}>
                      <Download className="w-4 h-4 mr-2" />
                      下载结果
                    </Button>
                  </div>
                </div>
                
                <div className="p-4">
                  <ImageComparison
                    beforeImage={resultImages.original}
                    afterImage={resultImages.enhanced}
                    className="w-full h-96"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* AI功能选择 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      选择AI功能
                    </h3>
                  </div>
                  
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AI_TASKS.map(task => {
                      const IconComponent = task.icon
                      return (
                        <div
                          key={task.id}
                          className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                          onClick={() => startAITask(task.id, task.params)}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-r ${task.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-r ${task.color}`}>
                                <IconComponent className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {task.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {task.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {/* Cleanup tile */}
                    <div
                      className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                      onClick={() => setShowCleanup(true)}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-rose-500`}>
                            <Zap className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              去物体（涂抹）
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              涂抹需要清理的区域，自动修复背景
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 任务状态 */}
                {currentTask && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        处理状态
                      </h3>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {currentTask.status === 'RUNNING' || currentTask.status === 'PENDING' ? (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : currentTask.status === 'COMPLETED' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {currentTask.status === 'PENDING' ? 'AI处理队列中...' :
                               currentTask.status === 'RUNNING' ? 'AI正在处理中...' :
                               currentTask.status === 'COMPLETED' ? 'AI处理完成' :
                               'AI处理失败'}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {currentTask.progress}%
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 transition-all duration-500 ease-out"
                              style={{ width: `${currentTask.progress}%` }}
                            />
                          </div>
                          
                          {currentTask.error && (
                            <p className="text-sm text-red-600 mt-2">
                              错误: {currentTask.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {showCleanup && selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-5xl rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">去物体 - 选择区域</h3>
            <CleanupEditor
              imageUrl={`/api/image/${selectedPhoto.id}/large?format=jpeg`}
              onCancel={() => setShowCleanup(false)}
              onSubmit={(mask) => startCleanup(mask)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
