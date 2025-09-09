'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadProgress } from '@/types'
import toast from 'react-hot-toast'

interface UploadFile extends File {
  id: string
  preview?: string
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map())
  const [selectedAlbum, setSelectedAlbum] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substring(7),
      preview: URL.createObjectURL(file)
    }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif', '.heic']
    },
    multiple: true
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
    setUploads(prev => {
      const newUploads = new Map(prev)
      newUploads.delete(fileId)
      return newUploads
    })
  }

  const sha256Hex = async (file: File): Promise<string> => {
    const buf = await file.arrayBuffer()
    const hash = await crypto.subtle.digest('SHA-256', buf)
    const bytes = new Uint8Array(hash)
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const uploadFile = async (file: UploadFile) => {
    try {
      // Precompute content hash for duplicate fast-path
      let contentHash: string | undefined
      try { contentHash = await sha256Hex(file) } catch {}

      // Request presigned URL
      const presignResponse = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          albumId: selectedAlbum || undefined,
          contentHash
        })
      })

      if (!presignResponse.ok) {
        throw new Error('获取上传地址失败')
      }

      const { photoId, uploadUrl, fileKey, completed } = await presignResponse.json()

      if (completed) {
        setUploads(prev => new Map(prev).set(file.id, { id: file.id, filename: file.name, progress: 100, status: 'completed' }))
        return
      }

      // Update progress
      setUploads(prev => new Map(prev).set(file.id, {
        id: file.id,
        filename: file.name,
        progress: 0,
        status: 'uploading'
      }))

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
      setUploads(prev => new Map(prev).set(file.id, {
        id: file.id,
        filename: file.name,
        progress: 50,
        status: 'processing'
      }))

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
      setUploads(prev => new Map(prev).set(file.id, {
        id: file.id,
        filename: file.name,
        progress: 100,
        status: 'completed'
      }))

    } catch (error) {
      console.error('Upload error:', error)
      setUploads(prev => new Map(prev).set(file.id, {
        id: file.id,
        filename: file.name,
        progress: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : '上传失败'
      }))
    }
  }

  const startUploads = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    toast.success(`Starting upload of ${files.length} files`)

    // Upload files sequentially to avoid overwhelming the server
    for (const file of files) {
      await uploadFile(file)
    }

    setIsUploading(false)
    
    // Check if all uploads completed successfully
    const finalUploads = Array.from(uploads.values())
    const successCount = finalUploads.filter(u => u.status === 'completed').length
    const failureCount = finalUploads.filter(u => u.status === 'failed').length
    
    if (successCount > 0) {
      toast.success(`${successCount} files uploaded successfully`)
    }
    if (failureCount > 0) {
      toast.error(`${failureCount} files failed to upload`)
    }
  }

  const clearAll = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
    setUploads(new Map())
  }

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = (upload: UploadProgress) => {
    switch (upload.status) {
      case 'uploading':
        return `上传中... ${upload.progress}%`
      case 'processing':
        return '处理中...'
      case 'completed':
        return '已完成'
      case 'failed':
        return `失败: ${upload.error}`
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          上传照片
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          上传新照片到你的相册
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-gray-300 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          
          {isDragActive ? (
            <p className="text-lg font-medium text-primary">将文件拖放到此处...</p>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                拖拽照片到此处，或点击选择文件
              </p>
              <p className="text-sm text-gray-500">
                支持 JPEG, PNG, WebP, AVIF 和 HEIC 格式，单个文件最大 50MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              已选文件 ({files.length})
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearAll}
                disabled={isUploading}
              >
                清空全部
              </Button>
              <Button
                onClick={startUploads}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    上传中...
                  </>
                ) : (
                  `上传 ${files.length} 个文件`
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => {
              const upload = uploads.get(file.id)
              
              return (
                <div key={file.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      {file.preview && (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      
                      {/* Upload Status */}
                      {upload && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(upload.status)}
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {getStatusText(upload)}
                            </span>
                          </div>
                          
                          {(upload.status === 'uploading' || upload.status === 'processing') && (
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-2">
                              <div 
                                className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                                style={{ width: `${upload.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    {!upload || upload.status !== 'uploading' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {uploads.size > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">上传统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Array.from(uploads.values()).filter(u => u.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">已完成</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {Array.from(uploads.values()).filter(u => u.status === 'uploading' || u.status === 'processing').length}
              </div>
              <div className="text-sm text-gray-500">处理中</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">
                {Array.from(uploads.values()).filter(u => u.status === 'failed').length}
              </div>
              <div className="text-sm text-gray-500">失败</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-500">
                {uploads.size}
              </div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
