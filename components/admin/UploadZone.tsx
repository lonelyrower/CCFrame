'use client';

import { useState, useCallback, DragEvent, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { UploadIcon } from '@/components/ui/Icons';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  photoId?: string;
  duplicate?: boolean;
  duplicateMessage?: string;
}

interface Album {
  id: string;
  title: string;
}

interface UploadZoneProps {
  onUploadComplete?: (photoIds: string[]) => void;
}

interface UploadApiResponse {
  message?: string;
  duplicate?: boolean;
  photo: {
    id: string;
    fileKey: string;
  };
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Upload settings
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const response = await fetch('/api/albums');
      if (response.ok) {
        const data = await response.json();
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // 将addFiles提升为useCallback以避免依赖问题
  const addFiles = useCallback((newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        file,
        id: `${Date.now()}-${Math.random()}`,
        progress: 0,
        status: 'pending' as const,
      }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  }, [addFiles]);

  const uploadFile = async (fileToUpload: UploadFile, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 2;

    try {
      // Update status
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileToUpload.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
        )
      );

      // Create form data
      const formData = new FormData();
      formData.append('file', fileToUpload.file);
      formData.append('title', fileToUpload.file.name);
      formData.append('isPublic', 'true');
      formData.append('skipDuplicateCheck', 'false');

      // Add album if selected
      if (selectedAlbumId) {
        formData.append('albumId', selectedAlbumId);
      }

      // Add tags if any
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }

      // Upload with progress
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f) => (f.id === fileToUpload.id ? { ...f, progress } : f))
          );
        }
      });

      const response = await new Promise<UploadApiResponse>((resolve, reject) => {
        xhr.onload = () => {
          try {
            const payload = xhr.responseText ? JSON.parse(xhr.responseText) : {};

            if (xhr.status >= 200 && xhr.status < 300) {
              if (payload.error) {
                reject(new Error(payload.error));
                return;
              }
              resolve(payload as UploadApiResponse);
            } else {
              const message = payload.error || xhr.statusText || 'Upload failed';
              reject(new Error(message));
            }
          } catch {
            reject(new Error('Invalid server response'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', '/api/upload/local');
        xhr.send(formData);
      });

      // Success
      const duplicateMessage = response.duplicate
        ? response.message || '照片已存在于库中'
        : undefined;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileToUpload.id
            ? {
                ...f,
                status: 'success' as const,
                progress: 100,
                photoId: response.photo.id,
                duplicate: response.duplicate ?? false,
                duplicateMessage,
              }
            : f
        )
      );
    } catch (error) {
      // Retry on failure
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying upload for ${fileToUpload.file.name} (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return uploadFile(fileToUpload, retryCount + 1);
      }

      // Failed after retries
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileToUpload.id
            ? {
                ...f,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      );
    }
  };

  const startUpload = async () => {
    setIsUploading(true);

    const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'error');

    // Upload with concurrency limit (4 at a time)
    const CONCURRENCY = 4;
    for (let i = 0; i < pendingFiles.length; i += CONCURRENCY) {
      const batch = pendingFiles.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map((file) => uploadFile(file)));
    }

    setIsUploading(false);

    // Call completion callback - use setFiles to get latest state
    setFiles((currentFiles) => {
      const successfulUploads = currentFiles
        .filter((f) => f.status === 'success' && f.photoId)
        .map((f) => f.photoId!);

      if (successfulUploads.length > 0 && onUploadComplete) {
        onUploadComplete(successfulUploads);
      }

      return currentFiles; // Return unchanged
    });
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'success'));
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return 'text-[color:var(--ds-accent)]';
      case 'error':
        return 'text-[color:var(--ds-accent)]';
      case 'uploading':
        return 'text-[color:var(--ds-luxury)]';
      default:
        return 'text-[color:var(--ds-muted)]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Settings */}
      <div className="p-4 sm:p-6 bg-stone-50 dark:bg-neutral-950 rounded-2xl space-y-5 ring-1 ring-stone-200/50 dark:ring-neutral-800/50">
        <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-50 tracking-tight">上传设置</h3>

        {/* Album Selection */}
        <div>
          <label htmlFor="album-select" className="block text-sm font-medium tracking-wide text-[color:var(--ds-muted)] mb-2">
            相册（可选）
          </label>
          <select
            id="album-select"
            value={selectedAlbumId}
            onChange={(e) => setSelectedAlbumId(e.target.value)}
            className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
          >
            <option value="">不选择相册</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.title}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium tracking-wide text-[color:var(--ds-muted)] mb-2">
            标签（可选）
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="输入标签后按回车"
            className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-[color:var(--ds-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[color:var(--ds-accent-10)] text-[color:var(--ds-accent)] rounded-full text-sm ring-1 ring-[color:var(--ds-accent-20)] font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:scale-110 transition-transform"
                  aria-label={`移除标签 ${tag}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-3xl p-6 sm:p-12 text-center transition-all duration-300
          ${isDragging ? 'border-[color:var(--ds-accent)] bg-[color:var(--ds-accent-10)] scale-[1.02]' : 'border-stone-300 dark:border-neutral-700 hover:border-[color:var(--ds-accent-50)]'}
        `}
      >
        <UploadIcon size={56} className="mx-auto text-[color:var(--ds-muted-soft)]" />
        <p className="mt-5 text-base sm:text-lg text-[color:var(--ds-muted)] font-light">
          拖放图片到这里，或{' '}
          <label className="text-[color:var(--ds-accent)] hover:underline cursor-pointer font-medium">
            点击选择
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </p>
        <p className="mt-2 text-sm text-[color:var(--ds-muted-soft)]">
          支持格式：JPG、PNG、WebP、HEIC（单个最大 50MB）
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tight">
              文件 ({files.length}) <span className="text-[color:var(--ds-accent)]">/ 已上传 {files.filter((f) => f.status === 'success').length}</span>
            </h3>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              <Button onClick={clearCompleted} variant="secondary" size="sm" className="flex-1 sm:flex-none">
                清除已完成
              </Button>
              <Button
                onClick={startUpload}
                variant="primary"
                size="sm"
                isLoading={isUploading}
                disabled={isUploading || files.every((f) => f.status === 'success')}
                className="flex-1 sm:flex-none"
              >
                {isUploading ? '上传中...' : '开始上传'}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 hover:ring-[color:var(--ds-accent-20)] transition-all duration-300"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate">{file.file.name}</p>
                  <p className="text-xs text-[color:var(--ds-muted-soft)] mt-0.5">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.error && (
                    <p className="text-xs text-[color:var(--ds-accent)] mt-1">{file.error}</p>
                  )}
                  {!file.error && file.duplicate && file.duplicateMessage && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {file.duplicateMessage}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="w-full sm:flex-1">
                    <div className="w-full bg-stone-200 dark:bg-neutral-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[var(--ds-accent)] to-[var(--ds-accent-soft)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                        aria-label={`上传进度 ${file.progress}%`}
                      />
                    </div>
                    <p className="text-xs text-[color:var(--ds-muted-soft)] mt-1.5 font-medium">{file.progress}%</p>
                  </div>
                )}

                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
                  <div className={`text-sm font-medium ${getStatusColor(file.status)}`}>
                    {file.status === 'success' && '已上传'}
                    {file.status === 'error' && '失败'}
                    {file.status === 'uploading' && '上传中...'}
                    {file.status === 'pending' && '等待中'}
                  </div>

                  {file.status !== 'uploading' && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-[color:var(--ds-muted-soft)] hover:text-[color:var(--ds-accent)] transition-colors"
                      aria-label="移除文件"
                      type="button"
                    >
                      x
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
