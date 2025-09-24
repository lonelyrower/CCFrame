"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Upload,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { fadeInScale, listItemRise } from '@/lib/motion/presets'
import { cn } from '@/lib/utils'
import {
  useUploadQueue,
  type UploadQueueItem,
  type UploadQueueStatus,
} from '@/components/providers/upload-queue-provider'
import { useCSRF } from '@/hooks/use-csrf'

interface UploadFile extends File {
  id: string
  preview?: string
  contentHash?: string | null
  hashing?: boolean
  hashProgress?: number
}

export function UploadInterface() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const { secureRequest, csrfToken, refreshToken } = useCSRF()

  const {
    stats: uploadStats,
    hasActive: queueHasActive,
    getItem: getUploadById,
    upsert: upsertUpload,
    update: patchUpload,
    remove: removeUploadEntry,
    clear: clearUploadQueue,
  } = useUploadQueue()

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => {
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
          size: validatedSize,
        }
      })

      setFiles((prev) => [...prev, ...newFiles])
    },
    [upsertUpload],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif', '.heic'],
    },
    multiple: true,
    noClick: false,
    noKeyboard: false,
  })

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== fileId)
    })
    removeUploadEntry(fileId)
  }

  const sha256Hex = async (file: File, onProgress?: (ratio: number) => void): Promise<string | null> => {
    const total = file.size
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const reader = file.stream().getReader()
      const chunks: BlobPart[] = []
      let loaded = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          chunks.push(value)
          loaded += value.length
          onProgress?.(loaded / total)
        }
      }
      const full = new Blob(chunks)
      const buf = await full.arrayBuffer()
      const hashBuf = await crypto.subtle.digest('SHA-256', buf)
      const bytes = new Uint8Array(hashBuf)
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
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
      let contentHash = file.contentHash ?? null

      if (!contentHash && !file.hashing) {
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, hashing: true, hashProgress: 0 } : f)))
        patchUpload(file.id, { status: 'hashing', progress: 0 })
        try {
          const hash = await sha256Hex(file, (ratio) => {
            const percent = Math.round(ratio * 100)
            setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, hashProgress: percent } : f)))
            patchUpload(file.id, { status: 'hashing', progress: percent })
          })
          contentHash = hash
          setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, contentHash: hash, hashing: false } : f)))
        } catch (error) {
          setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, hashing: false } : f)))
        }
      }

      const presignBody = {
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        albumId: selectedAlbum || undefined,
        ...(contentHash ? { contentHash } : {}),
      }

      if (!csrfToken) {
        await refreshToken()
      }

      let presignResponse = await secureRequest('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presignBody),
      })

      if (presignResponse.status === 403) {
        await refreshToken()
        presignResponse = await secureRequest('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(presignBody),
        })
      }

      if (!presignResponse.ok) {
        const payload = await presignResponse.json().catch(() => null)
        const message = payload?.error || '预签名请求失败'
        throw new Error(message)
      }

      const presignData: {
        photoId: string
        uploadUrl?: string
        fileKey?: string
        completed?: boolean
        duplicate?: boolean
      } = await presignResponse.json()

      if (presignData.completed && presignData.duplicate && presignData.photoId) {
        patchUpload(file.id, { status: 'completed', progress: 100 })
        return 'completed'
      }

      const { uploadUrl, photoId, fileKey } = presignData
      if (!uploadUrl || !photoId || !fileKey) {
        throw new Error('上传信息不完整')
      }

      patchUpload(file.id, { status: 'uploading', progress: 10 })

      const uploadHeaders: Record<string, string> = {}
      if (file.type) {
        uploadHeaders['Content-Type'] = file.type
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: uploadHeaders,
        body: file,
      })

      if (!uploadResponse.ok) {
        const details = await uploadResponse.text().catch(() => '')
        throw new Error(details || '文件上传失败')
      }

      patchUpload(file.id, { status: 'processing', progress: 70 })

      let commitResponse = await secureRequest('/api/upload/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, fileKey }),
      })

      if (commitResponse.status === 403) {
        await refreshToken()
        commitResponse = await secureRequest('/api/upload/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId, fileKey }),
        })
      }

      if (!commitResponse.ok) {
        const payload = await commitResponse.json().catch(() => null)
        const message = payload?.error || '提交上传记录失败'
        throw new Error(message)
      }

      patchUpload(file.id, { status: 'completed', progress: 100 })
      return 'completed'
    } catch (error) {
      patchUpload(file.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
      return 'failed'
    }
  }



  const handleUploadAll = async () => {
    if (files.length === 0) {
      toast('请选择文件后再开始上传', { icon: 'ℹ️' })
      return
    }

    setIsUploading(true)
    const results = await Promise.all(files.map((file) => uploadFile(file)))
    const failed = results.filter((r) => r === 'failed').length
    if (failed > 0) {
      toast.error(`${failed} 个文件上传失败，请检查日志`)
    } else {
      toast.success('全部文件已进入处理流水线')
    }
    setIsUploading(false)
  }

  const clearAll = () => {
    files.forEach((file) => file.preview && URL.revokeObjectURL(file.preview))
    setFiles([])
    clearUploadQueue()
  }

  const totalCount = uploadStats.total
  const completedCount = uploadStats.completed
  const failedCount = uploadStats.failed
  const pendingCount = uploadStats.pending
  const activeCount = uploadStats.active

  return (
    <div className="space-y-12">
      <Surface tone="panel" padding="lg" className="shadow-subtle">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Heading size="md">拖拽或选择文件上传</Heading>
            <Text tone="secondary" size="sm">
              支持批量拖拽与队列上传，系统会自动生成多种尺寸与嵌入信息。
            </Text>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <Badge>JPG</Badge>
              <Badge>PNG</Badge>
              <Badge>WebP</Badge>
              <Badge>HEIC</Badge>
              <span>单个文件建议 &lt; 50MB</span>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row">
            <select
              value={selectedAlbum}
              onChange={(event) => setSelectedAlbum(event.target.value)}
              className="rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
            >
              <option value="">默认相册</option>
              <option value="editorial">Editorial</option>
              <option value="campaign">Campaign</option>
            </select>
            <Button variant="secondary" onClick={open}>
              浏览文件
            </Button>
          </div>
        </div>

        <div
          {...getRootProps({
            className: cn(
              'mt-6 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-outline/40 bg-surface-canvas/80 p-8 transition',
              isDragActive && 'border-primary bg-primary/5',
            ),
          })}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 text-primary" />
          <Text size="sm" weight="medium" className="mt-3">
            拖放文件到此处，或点击选择文件
          </Text>
          <Text tone="secondary" size="xs" className="mt-1">
            支持批量上传，自动去重与恢复断点
          </Text>
        </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={handleUploadAll} disabled={isUploading || files.length === 0} className="gap-2">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? '正在上传…' : '开始上传'}
          </Button>
          <Button variant="ghost" onClick={clearAll} disabled={files.length === 0}>
            清空列表
          </Button>
        </div>
      </Surface>

      {files.length > 0 ? (
        <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <Heading size="sm">上传队列</Heading>
            {queueHasActive ? (
              <Text tone="secondary" size="xs" className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> 正在处理中
              </Text>
            ) : null}
          </div>

          <div className="grid gap-3">
            {files.map((file, index) => {
              const upload = getUploadById(file.id)

              return (
                <AnimateOnScroll key={file.id} variants={listItemRise} delay={index * 0.04} className="h-full">
                  <Surface tone="canvas" padding="md" className="flex h-full items-start gap-3 border border-surface-outline/40">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-panel">
                      {file.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={file.preview} alt={file.name} className="h-full w-full object-cover" />
                      ) : null}
                      {file.hashing ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-contrast-surface/40 text-[11px] font-medium text-text-inverted">
                          Hash {file.hashProgress || 0}%
                        </div>
                      ) : null}
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

                      {upload ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            {getStatusIcon(upload.status)}
                            <span>{getStatusText(upload)}</span>
                          </div>
                          {(upload.status === 'uploading' || upload.status === 'processing' || upload.status === 'hashing') ? (
                            <div className="h-1 w-full overflow-hidden rounded-full bg-surface-outline/30">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${upload.progress}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {!(upload && (upload.status === 'uploading' || upload.status === 'processing' || upload.status === 'hashing')) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        className="flex-shrink-0 text-text-muted hover:text-text-primary"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </Surface>
                </AnimateOnScroll>
              )
            })}
          </div>
        </Surface>
      ) : null}

      {totalCount > 0 ? (
        <AnimateOnScroll variants={fadeInScale}>
          <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
            <Heading size="sm">上传统计</Heading>
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
              <Stat label="成功" value={completedCount} tone="text-emerald-500" />
              <Stat label="进行中" value={activeCount + pendingCount} tone="text-primary" />
              <Stat label="失败" value={failedCount} tone="text-red-500" />
              <Stat label="总计" value={totalCount} tone="text-text-muted" />
            </div>
          </Surface>
        </AnimateOnScroll>
      ) : null}
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-surface-outline/30 bg-surface-panel/60 px-2 py-0.5 text-xs text-text-secondary">{children}</span>
}

function getStatusIcon(status: UploadQueueStatus) {
  switch (status) {
    case 'uploading':
    case 'processing':
    case 'hashing':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
    case 'completed':
      return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
    case 'failed':
      return <AlertCircle className="h-3.5 w-3.5 text-red-500" />
    default:
      return <Clock className="h-3.5 w-3.5 text-text-muted" />
  }
}

function getStatusText(upload: UploadQueueItem): string {
  switch (upload.status) {
    case 'queued':
      return '等待上传'
    case 'hashing':
      return '计算指纹…'
    case 'uploading':
      return `上传中 ${Math.round(upload.progress)}%`
    case 'processing':
      return '处理中…'
    case 'completed':
      return '已完成'
    case 'failed':
      return upload.error ? `失败：${upload.error}` : '上传失败'
    default:
      return upload.status
  }
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="space-y-1">
      <Text size="lg" weight="semibold" className={cn('text-text-primary', tone)}>
        {value}
      </Text>
      <Text tone="secondary" size="xs">
        {label}
      </Text>
    </div>
  )
}





