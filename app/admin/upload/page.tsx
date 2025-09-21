'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUploadQueue, type UploadQueueItem, type UploadQueueStatus } from '@/components/providers/upload-queue-provider'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { fadeInScale, listItemRise } from '@/lib/motion/presets'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface UploadFile extends File {
  id: string
  preview?: string
  contentHash?: string | null
  hashing?: boolean
  hashProgress?: number
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const {
    stats: uploadStats,
    hasActive: queueHasActive,
    getItem: getUploadById,
    upsert: upsertUpload,
    update: patchUpload,
    remove: removeUploadEntry,
    clear: clearUploadQueue,
  } = useUploadQueue()
  const [selectedAlbum, setSelectedAlbum] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const validatedSize = file.size || 0
      const generatedId = Math.random().toString(36).substring(7)

      upsertUpload({
        id: generatedId,
        filename: file.name,
        progress: 0,
        status: 'queued',
        size: validatedSize,
      })

      return {
        ...file,
        id: generatedId,
        preview: URL.createObjectURL(file),
        size: validatedSize
      }
    })

    setFiles(prev => [...prev, ...newFiles])
  }, [upsertUpload])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif', '.heic']
    },
    multiple: true,
    noClick: false, // 允许点击
    noKeyboard: false
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
    removeUploadEntry(fileId)
  }

  // Incremental hashing (streaming) to provide progress for large files
  const sha256Hex = async (file: File, onProgress?: (ratio: number) => void): Promise<string | null> => {
    const total = file.size
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      // Browser path - read full buffer (still okay for <50MB but we mimic progress)
      const reader = file.stream().getReader()
  const chunks: BlobPart[] = []
      let loaded = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          // value is a Uint8Array (ArrayBufferView) and valid BlobPart under lib.dom.d.ts
          chunks.push(value)
          loaded += value.length
          onProgress?.(loaded / total)
        }
      }
      const full = new Blob(chunks as BlobPart[])
      const buf = await full.arrayBuffer()
      const hashBuf = await crypto.subtle.digest('SHA-256', buf)
      const bytes = new Uint8Array(hashBuf)
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    }
    // Fallback when crypto.subtle is unavailable (older browsers)
    return null
  }

  const uploadFile = async (file: UploadFile): Promise<'completed' | 'failed'> => {
    upsertUpload({
      id: file.id,
      filename: file.name,
      progress: 0,
      status: 'queued',
      size: file.size,
      error: undefined,
    })

    try {
      // Precompute content hash with progress (duplicate fast-path)
      if (!file.contentHash && !file.hashing) {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, hashing: true, hashProgress: 0 } : f))
        patchUpload(file.id, { status: 'hashing', progress: 0 })
        try {
          const hash = await sha256Hex(file, (r) => {
            const percent = Math.round(r * 100)
            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, hashProgress: percent } : f))
            patchUpload(file.id, { status: 'hashing', progress: percent })
          })
          file.contentHash = hash
        } catch (e) {
          // Ignore hashing error, continue without
          file.contentHash = null
        } finally {
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, hashing: false } : f))
          patchUpload(file.id, { status: 'queued', progress: 0 })
        }
      }

      // Request presigned URL
      const presignPayload: Record<string, unknown> = {
        filename: file.name,
        contentType: file.type,
        size: file.size,
        albumId: selectedAlbum || undefined,
      }

      if (file.contentHash && file.contentHash.length === 64) {
        presignPayload.contentHash = file.contentHash
      }

      const presignResponse = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presignPayload)
      })

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json().catch(() => ({}))
        const errorMessage = errorData.error || `服务器错误 (${presignResponse.status})`
        throw new Error(`获取上传地址失败: ${errorMessage}`)
      }

  const { photoId, uploadUrl, fileKey, completed, duplicate } = await presignResponse.json()

      if (completed) {
        patchUpload(file.id, { status: 'completed', progress: 100 })
        if (duplicate) {
          toast.success(`重复文件已快速关联: ${file.name}`)
        }
        return 'completed'
      }

      // Update progress
      patchUpload(file.id, { status: 'uploading', progress: 0 })

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('上传失败')
      }

      // Update progress
      patchUpload(file.id, { status: 'processing', progress: 50 })

      // Commit upload
      const commitResponse = await fetch('/api/upload/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, fileKey })
      })

      if (!commitResponse.ok) {
        throw new Error('处理上传失败')
      }

      // Mark as completed
      patchUpload(file.id, { status: 'completed', progress: 100 })

      return 'completed'

    } catch (error) {
      console.error('Upload error:', error)
      patchUpload(file.id, { status: 'failed', progress: 0, error: error instanceof Error ? error.message : '�ϴ�ʧ��' })
      return 'failed'
    }
  }

  const startUploads = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    toast.success(`开始上传 ${files.length} 个文件`)

    // Upload files sequentially to avoid overwhelming the server
    let successCount = 0
    let failureCount = 0
    for (const file of files) {
      const result = await uploadFile(file)
      if (result === 'completed') {
        successCount += 1
      } else if (result === 'failed') {
        failureCount += 1
      }
    }

    setIsUploading(false)

    if (successCount > 0) {
      toast.success(`${successCount} files uploaded successfully`)
    }
    if (failureCount > 0) {
      toast.error(`${failureCount} 个文件上传失败`)
    }
  }

  const clearAll = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
    clearUploadQueue()
  }

  const getStatusIcon = (status: UploadQueueStatus) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case 'hashing':
        return <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />
      case 'queued':
        return <Clock className="h-4 w-4 text-text-muted" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-state-success" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-state-danger" />
      default:
        return null
    }
  }

  const getStatusText = (upload: UploadQueueItem) => {
    switch (upload.status) {
      case 'uploading':
        return `上传中… ${upload.progress}%`
      case 'processing':
        return '处理图像…'
      case 'hashing':
        return `计算哈希… ${upload.progress}%`
      case 'queued':
        return '等待上传'
      case 'completed':
        return '完成'
      case 'failed':
        return `失败: ${upload.error ?? '未知错误'}`
      default:
        return ''
    }
  }



  const completedCount = uploadStats.completed
  const activeCount = uploadStats.active
  const failedCount = uploadStats.failed
  const pendingCount = uploadStats.pending
  const totalCount = uploadStats.total

  const dropzoneClassName = cn(
    'flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-all duration-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
    'touch-manipulation active:scale-[0.99]',
    isDragActive
      ? 'border-primary/80 bg-primary/10 shadow-floating'
      : 'border-surface-outline/60 bg-surface-canvas hover:border-primary/50 hover:bg-surface-panel'
  )

  return (
    <div className="space-y-12 pb-20 pt-6">
      <Container size="xl" bleed="none" className="space-y-6">
        <AnimateOnScroll>
          <div className="space-y-2">
            <Heading size="lg">上传照片</Heading>
            <Text tone="secondary">
              上传后将自动运行重复检测与缩略图生成，请保持页面开启直至状态完成。
            </Text>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll variants={fadeInScale}>
          <Surface tone="panel" padding="lg" className="shadow-subtle space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <Heading size="sm">拖拽或选择文件</Heading>
                <Text tone="secondary" size="sm">
                  支持 JPEG、PNG、WebP、AVIF、HEIC，单个文件最大 50MB。
                </Text>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation()
                  open()
                }}
              >
                浏览文件
              </Button>
            </div>

            <div {...getRootProps({ className: dropzoneClassName })}>
              <input {...getInputProps()} />
              <div className={cn('mb-4 transition-transform duration-200', isDragActive && 'scale-110')}>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-glow-primary opacity-30 blur-lg" />
                  <div className="relative rounded-full bg-surface-panel p-4 shadow-surface">
                    <Upload className={cn('h-8 w-8 sm:h-12 sm:w-12 text-text-muted', isDragActive && 'text-primary')} />
                  </div>
                </div>
              </div>

              {isDragActive ? (
                <div className="space-y-2">
                  <Text size="lg" weight="medium" className="text-primary">
                    松开即可开始处理…
                  </Text>
                  <div className="mx-auto h-1 w-32 overflow-hidden rounded-full bg-primary/20">
                    <div className="h-full w-full animate-pulse rounded-full bg-primary" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Text size="md" weight="medium">
                    <span className="hidden sm:inline">拖拽文件到此处</span>
                    <span className="sm:hidden">轻触上传</span>
                    ，或点击下方按钮选择文件
                  </Text>
                  <Text tone="secondary" size="xs">
                    也支持直接粘贴截图，上传过程中可离开页面，任务会继续执行。
                  </Text>
                  <div className="pt-2 sm:hidden">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation()
                        open()
                      }}
                      className="min-h-[44px] min-w-[120px]"
                    >
                      选择文件
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Surface>
        </AnimateOnScroll>

        {files.length > 0 && (
          <AnimateOnScroll variants={fadeInScale}>
            <Surface tone="panel" padding="lg" className="shadow-subtle space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Heading size="sm">已选文件（{files.length}）</Heading>
                  <Text tone="secondary" size="xs">
                    Hash 预处理完成后会自动排除重复文件，保持页面开启以查看进度。
                  </Text>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearAll}
                    disabled={isUploading || queueHasActive}
                  >
                    清空列表
                  </Button>
                  <Button type="button" onClick={startUploads} disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        正在上传…
                      </>
                    ) : (
                      `上传 ${files.length} 个文件`
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {files.map((file, index) => {
                  const upload = getUploadById(file.id)

                  return (
                    <AnimateOnScroll
                      key={file.id}
                      variants={listItemRise}
                      delay={index * 0.04}
                      className="h-full"
                    >
                      <Surface
                        tone="canvas"
                        padding="md"
                        className="flex h-full items-start gap-3 border border-surface-outline/40"
                      >
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-panel">
                          {file.preview && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={file.preview} alt={file.name} className="h-full w-full object-cover" />
                          )}
                          {file.hashing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <span className="text-[11px] font-medium text-white">
                                Hash {file.hashProgress || 0}%
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="space-y-1">
                            <Text size="sm" weight="medium" className="truncate">
                              {file.name}
                            </Text>
                            <Text tone="secondary" size="xs">
                              {file.size && !Number.isNaN(file.size) ? (file.size / 1024 / 1024).toFixed(1) : '0.0'} MB
                            </Text>
                          </div>

                          {upload && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(upload.status)}
                                <Text tone="secondary" size="xs">
                                  {getStatusText(upload)}
                                </Text>
                              </div>
                              {(upload.status === 'uploading' || upload.status === 'processing' || upload.status === 'hashing') && (
                                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-outline/30">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all duration-300"
                                    style={{ width: `${upload.progress}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {!(upload && (upload.status === 'uploading' || upload.status === 'processing' || upload.status === 'hashing')) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(file.id)}
                            className="flex-shrink-0 text-text-muted hover:text-text-primary"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </Surface>
                    </AnimateOnScroll>
                  )
                })}
              </div>
            </Surface>
          </AnimateOnScroll>
        )}

        {totalCount > 0 && (
          <AnimateOnScroll variants={fadeInScale}>
            <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
              <Heading size="sm">上传统计</Heading>
              <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                <div className="space-y-1">
                  <Text size="lg" weight="semibold">
                    {completedCount}
                  </Text>
                  <Text tone="secondary" size="xs">
                    成功
                  </Text>
                </div>
                <div className="space-y-1">
                  <Text size="lg" weight="semibold" className="text-primary">
                    {activeCount + pendingCount}
                  </Text>
                  <Text tone="secondary" size="xs">
                    进行中{pendingCount > 0 ? `（排队 ${pendingCount}）` : ''}
                  </Text>
                </div>
                <div className="space-y-1">
                  <Text size="lg" weight="semibold" className="text-state-danger">
                    {failedCount}
                  </Text>
                  <Text tone="secondary" size="xs">
                    失败
                  </Text>
                </div>
                <div className="space-y-1">
                  <Text size="lg" weight="semibold" className="text-text-muted">
                    {totalCount}
                  </Text>
                  <Text tone="secondary" size="xs">
                    总计
                  </Text>
                </div>
              </div>
            </Surface>
          </AnimateOnScroll>
        )}
      </Container>
    </div>
  )

}




