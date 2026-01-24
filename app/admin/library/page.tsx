'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { BulkEditDialog } from '@/components/admin/BulkEditDialog';
import { getImageUrl } from '@/lib/image/utils';

interface Photo {
  id: string;
  title: string | null;
  fileKey: string;
  width: number | null;
  height: number | null;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  useEffect(() => {
    loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/photos?page=${page}&limit=24`);
      const data = await response.json();

      setPhotos(data.photos);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const selectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map((p) => p.id)));
    }
  };

  const togglePublic = async (photoId: string, currentState: boolean) => {
    try {
      await fetch(`/api/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !currentState }),
      });

      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, isPublic: !currentState } : p))
      );
    } catch (error) {
      console.error('Error toggling public:', error);
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;

    try {
      await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setSelectedPhotos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const batchTogglePublic = async (isPublic: boolean) => {
    const promises = Array.from(selectedPhotos).map((photoId) =>
      fetch(`/api/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      })
    );

    await Promise.all(promises);
    await loadPhotos();
    setSelectedPhotos(new Set());
  };

  const handleBulkEdit = async (data: { tags?: string[]; albumId?: string | null }) => {
    const promises = Array.from(selectedPhotos).map((photoId) =>
      fetch(`/api/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    );

    await Promise.all(promises);
    await loadPhotos();
    setSelectedPhotos(new Set());
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">
                照片库
              </h1>
              <p className="text-stone-600 dark:text-stone-400">
                已加载 {photos.length} 张照片
              </p>
            </div>
            <Button onClick={() => router.push('/admin/upload')} variant="primary" className="w-full sm:w-auto">
              上传照片
            </Button>
          </div>

          {/* Batch Actions */}
          {selectedPhotos.size > 0 && (
            <div className="flex items-center gap-3 p-5 bg-[color:var(--ds-accent-10)] rounded-2xl flex-wrap ring-1 ring-[color:var(--ds-accent-20)]">
              <span className="text-sm font-semibold text-[color:var(--ds-accent)]">
                已选择 {selectedPhotos.size} 张
              </span>
              <Button
                onClick={() => setShowBulkEdit(true)}
                variant="secondary"
                size="sm"
              >
                编辑标签/相册
              </Button>
              <Button
                onClick={() => batchTogglePublic(true)}
                variant="secondary"
                size="sm"
              >
                设为公开
              </Button>
              <Button
                onClick={() => batchTogglePublic(false)}
                variant="secondary"
                size="sm"
              >
                设为私密
              </Button>
              <Button
                onClick={() => setSelectedPhotos(new Set())}
                variant="ghost"
                size="sm"
              >
                清除选择
              </Button>
            </div>
          )}

          {/* Select All */}
          <div className="mt-4">
            <button
              onClick={selectAll}
              className="text-sm font-medium text-[color:var(--ds-accent)] hover:text-[color:var(--ds-accent-strong)] transition-colors"
            >
              {selectedPhotos.size === photos.length ? '取消全选' : '全选'}
            </button>
          </div>
        </div>

        {/* Photo Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[color:var(--ds-accent)]" />
              <p className="text-sm tracking-widest text-stone-600 dark:text-stone-400 font-light">加载中</p>
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-stone-600 dark:text-stone-400 font-light mb-6">暂无照片</p>
            <Button onClick={() => router.push('/admin/upload')} variant="primary">
              上传第一张照片
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`
                  relative group rounded-2xl overflow-hidden bg-stone-200 dark:bg-neutral-800
                  aspect-square cursor-pointer transition-all duration-300
                  ${selectedPhotos.has(photo.id) ? 'ring-4 ring-[color:var(--ds-accent)] scale-[0.97]' : 'hover:scale-[1.02]'}
                `}
                onClick={() => togglePhotoSelection(photo.id)}
              >
                {/* Photo */}
                <img
                  src={getImageUrl(photo.fileKey, photo.isPublic, { width: 400, quality: 85 })}
                  alt={photo.title || 'Photo'}
                  className="w-full h-full object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium truncate">
                      {photo.title || '未命名'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {photo.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-white/20 backdrop-blur rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePublic(photo.id, photo.isPublic);
                    }}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-all backdrop-blur-sm
                      ${
                        photo.isPublic
                          ? 'bg-green-500/90 text-white hover:bg-green-600'
                          : 'bg-stone-500/90 text-white hover:bg-stone-600'
                      }
                    `}
                  >
                    {photo.isPublic ? '公开' : '私密'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhoto(photo.id);
                    }}
                    className="px-3 py-1.5 bg-[color:var(--ds-accent-90)] text-white rounded-lg text-xs font-medium hover:bg-[color:var(--ds-accent-strong)] transition-all backdrop-blur-sm"
                  >
                    删除
                  </button>
                </div>

                {/* Selection Indicator */}
                {selectedPhotos.has(photo.id) && (
                  <div className="absolute top-3 left-3">
                    <div className="w-7 h-7 bg-[color:var(--ds-accent)] rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="secondary"
            >
              上一页
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
              第 {page} / {totalPages} 页
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="secondary"
            >
              下一页
            </Button>
          </div>
        )}

        {/* Bulk Edit Dialog */}
        {showBulkEdit && (
          <BulkEditDialog
            selectedCount={selectedPhotos.size}
            onClose={() => setShowBulkEdit(false)}
            onSave={handleBulkEdit}
          />
        )}
      </div>
    </div>
  );
}
