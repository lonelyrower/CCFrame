'use client';

import { useState, useCallback, DragEvent, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  photoId?: string;
}

interface Album {
  id: string;
  title: string;
}

interface UploadZoneProps {
  onUploadComplete?: (photoIds: string[]) => void;
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

      const response = await new Promise<{ photo: { id: string; fileKey: string } }>((resolve, reject) => {
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
          f.id === fileToUpload.id
            ? { ...f, status: 'success' as const, progress: 100, photoId: response.photo.id }
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
        return 'text-[#e63946] dark:text-[#ff6b7a]';
      case 'error':
        return 'text-[#e63946] dark:text-[#ff6b7a]';
      case 'uploading':
        return 'text-[#d4af37]';
      default:
        return 'text-stone-600 dark:text-stone-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Settings */}
      <div className="p-6 bg-stone-50 dark:bg-neutral-950 rounded-2xl space-y-5 ring-1 ring-stone-200/50 dark:ring-neutral-800/50">
        <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-50 tracking-tight">Upload Settings</h3>

        {/* Album Selection */}
        <div>
          <label htmlFor="album-select" className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-2">
            Album (Optional)
          </label>
          <select
            id="album-select"
            value={selectedAlbumId}
            onChange={(e) => setSelectedAlbumId(e.target.value)}
            className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 dark:focus:ring-[#ff6b7a]/20 focus:border-[#e63946] dark:focus:border-[#ff6b7a] transition-all duration-300"
          >
            <option value="">No Album</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.title}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-2">
            Tags (Optional)
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type tag and press Enter"
            className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 dark:focus:ring-[#ff6b7a]/20 focus:border-[#e63946] dark:focus:border-[#ff6b7a] transition-all duration-300"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e63946]/10 dark:bg-[#ff6b7a]/10 text-[#e63946] dark:text-[#ff6b7a] rounded-full text-sm ring-1 ring-[#e63946]/20 dark:ring-[#ff6b7a]/20 font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:scale-110 transition-transform"
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
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
          border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300
          ${isDragging ? 'border-[#e63946] bg-[#e63946]/5 dark:bg-[#ff6b7a]/10 scale-[1.02]' : 'border-stone-300 dark:border-neutral-700 hover:border-[#e63946]/50 dark:hover:border-[#ff6b7a]/50'}
        `}
      >
        <svg
          className="mx-auto h-14 w-14 text-stone-400 dark:text-neutral-500"
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
        <p className="mt-5 text-lg text-stone-700 dark:text-stone-300 font-light">
          Drag and drop images here, or{' '}
          <label className="text-[#e63946] dark:text-[#ff6b7a] hover:underline cursor-pointer font-medium">
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
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Supports: JPG, PNG, WebP, HEIC (Max 50MB each)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tight">
              Files ({files.length}) <span className="text-[#e63946] dark:text-[#ff6b7a]">· {files.filter((f) => f.status === 'success').length} uploaded</span>
            </h3>
            <div className="flex gap-2">
              <Button onClick={clearCompleted} variant="secondary" size="sm">
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

          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 hover:ring-[#e63946]/20 dark:hover:ring-[#ff6b7a]/20 transition-all duration-300"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate">{file.file.name}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.error && (
                    <p className="text-xs text-[#e63946] dark:text-[#ff6b7a] mt-1">{file.error}</p>
                  )}
                </div>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="flex-1">
                    <div className="w-full bg-stone-200 dark:bg-neutral-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#e63946] to-[#ff6b7a] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                        aria-label={`Upload progress ${file.progress}%`}
                      />
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 font-medium">{file.progress}%</p>
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
                    className="text-stone-400 hover:text-[#e63946] dark:hover:text-[#ff6b7a] transition-colors"
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
