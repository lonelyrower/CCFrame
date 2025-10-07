'use client';

import { useState, useCallback, DragEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  photoId?: string;
}

interface UploadZoneProps {
  onUploadComplete?: (photoIds: string[]) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        file,
        id: `${Date.now()}-${Math.random()}`,
        progress: 0,
        status: 'pending' as const,
      }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const uploadFile = async (uploadFile: UploadFile, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 2;

    try {
      // Update status
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
        )
      );

      // Create form data
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('title', uploadFile.file.name);
      formData.append('isPublic', 'true');

      // Upload with progress
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
          );
        }
      });

      const response = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', '/api/upload/local');
        xhr.send(formData);
      });

      // Success
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'success' as const, progress: 100, photoId: response.photo.id }
            : f
        )
      );
    } catch (error) {
      // Retry on failure
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying upload for ${uploadFile.file.name} (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return uploadFile(uploadFile, retryCount + 1);
      }

      // Failed after retries
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
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

    // Call completion callback
    const successfulUploads = files
      .filter((f) => f.status === 'success' && f.photoId)
      .map((f) => f.photoId!);

    if (successfulUploads.length > 0 && onUploadComplete) {
      onUploadComplete(successfulUploads);
    }
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
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'uploading':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}
        `}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Drag and drop images here, or{' '}
          <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
            browse
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Supports: JPG, PNG, WebP, HEIC (Max 50MB each)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Files ({files.length}) - {files.filter((f) => f.status === 'success').length} uploaded
            </h3>
            <div className="flex gap-2">
              <Button onClick={clearCompleted} variant="ghost" size="sm">
                Clear Completed
              </Button>
              <Button
                onClick={startUpload}
                variant="primary"
                size="sm"
                isLoading={isUploading}
                disabled={isUploading || files.every((f) => f.status === 'success')}
              >
                {isUploading ? 'Uploading...' : 'Start Upload'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{file.progress}%</p>
                  </div>
                )}

                {/* Status */}
                <div className={`text-sm font-medium ${getStatusColor(file.status)}`}>
                  {file.status === 'success' && '✓ Uploaded'}
                  {file.status === 'error' && '✗ Failed'}
                  {file.status === 'uploading' && 'Uploading...'}
                  {file.status === 'pending' && 'Pending'}
                </div>

                {/* Remove Button */}
                {file.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
