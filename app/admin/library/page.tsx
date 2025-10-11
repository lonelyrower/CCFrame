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
    if (!confirm('Are you sure you want to delete this photo?')) return;

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">
                Photo Library
              </h1>
              <p className="text-stone-600 dark:text-stone-400">
                {photos.length} photos loaded
              </p>
            </div>
            <Button onClick={() => router.push('/admin/upload')} variant="primary">
              Upload Photos
            </Button>
          </div>

          {/* Batch Actions */}
          {selectedPhotos.size > 0 && (
            <div className="flex items-center gap-3 p-5 bg-[#e63946]/10 dark:bg-[#ff6b7a]/10 rounded-2xl flex-wrap ring-1 ring-[#e63946]/20 dark:ring-[#ff6b7a]/20">
              <span className="text-sm font-semibold text-[#e63946] dark:text-[#ff6b7a]">
                {selectedPhotos.size} selected
              </span>
              <Button
                onClick={() => setShowBulkEdit(true)}
                variant="secondary"
                size="sm"
              >
                Edit Tags/Album
              </Button>
              <Button
                onClick={() => batchTogglePublic(true)}
                variant="secondary"
                size="sm"
              >
                Make Public
              </Button>
              <Button
                onClick={() => batchTogglePublic(false)}
                variant="secondary"
                size="sm"
              >
                Make Private
              </Button>
              <Button
                onClick={() => setSelectedPhotos(new Set())}
                variant="ghost"
                size="sm"
              >
                Clear
              </Button>
            </div>
          )}

          {/* Select All */}
          <div className="mt-4">
            <button
              onClick={selectAll}
              className="text-sm font-medium text-[#e63946] hover:text-[#c1121f] dark:text-[#ff6b7a] dark:hover:text-[#ff8fa3] transition-colors"
            >
              {selectedPhotos.size === photos.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Photo Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[#e63946] dark:border-t-[#ff6b7a]" />
              <p className="text-sm uppercase tracking-widest text-stone-600 dark:text-stone-400 font-light">Loading</p>
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-stone-600 dark:text-stone-400 font-light mb-6">No photos yet</p>
            <Button onClick={() => router.push('/admin/upload')} variant="primary">
              Upload Your First Photos
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
                  ${selectedPhotos.has(photo.id) ? 'ring-4 ring-[#e63946] dark:ring-[#ff6b7a] scale-[0.97]' : 'hover:scale-[1.02]'}
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
                      {photo.title || 'Untitled'}
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
                    {photo.isPublic ? 'Public' : 'Private'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhoto(photo.id);
                    }}
                    className="px-3 py-1.5 bg-[#e63946]/90 dark:bg-[#ff6b7a]/90 text-white rounded-lg text-xs font-medium hover:bg-[#c1121f] dark:hover:bg-[#ff8fa3] transition-all backdrop-blur-sm"
                  >
                    Delete
                  </button>
                </div>

                {/* Selection Indicator */}
                {selectedPhotos.has(photo.id) && (
                  <div className="absolute top-3 left-3">
                    <div className="w-7 h-7 bg-[#e63946] dark:bg-[#ff6b7a] rounded-full flex items-center justify-center shadow-lg">
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
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="secondary"
            >
              Next
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
