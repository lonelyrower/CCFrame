'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Masonry } from '@/components/gallery/Masonry';
import { Lightbox } from '@/components/gallery/Lightbox';
import { PHOTOS_PER_PAGE } from '@/lib/constants';

interface Photo {
  id: string;
  title: string | null;
  fileKey: string;
  width: number | null;
  height: number | null;
  tags: string[];
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadPhotos = useCallback(async (pageNum: number) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/photos?isPublic=true&page=${pageNum}&limit=${PHOTOS_PER_PAGE}`
      );
      const data = await response.json();

      if (data.photos.length === 0) {
        setHasMore(false);
        return;
      }

      setPhotos((prev) => (pageNum === 1 ? data.photos : [...prev, ...data.photos]));
      setHasMore(data.pagination.page < data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    loadPhotos(1);
  }, []);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading]);

  useEffect(() => {
    if (page > 1) {
      loadPhotos(page);
    }
  }, [page]);

  const handlePhotoClick = (photo: Photo) => {
    const index = photos.findIndex((p) => p.id === photo.id);
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      const prevIndex = selectedIndex - 1;
      setSelectedPhoto(photos[prevIndex]);
      setSelectedIndex(prevIndex);
    }
  };

  const handleNext = () => {
    if (selectedIndex < photos.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedPhoto(photos[nextIndex]);
      setSelectedIndex(nextIndex);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-2">
            全部照片
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {photos.length} 张照片已加载
          </p>
        </div>

        {/* Masonry Grid */}
        {photos.length > 0 ? (
          <Masonry photos={photos} onPhotoClick={handlePhotoClick} />
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">暂无照片</p>
            </div>
          )
        )}

        {/* Load More Indicator */}
        {hasMore && (
          <div ref={loadMoreRef} className="mt-8 text-center py-8">
            {isLoading && (
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
            )}
          </div>
        )}

        {!hasMore && photos.length > 0 && (
          <div className="mt-8 text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">已加载全部照片</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <Lightbox
          photo={selectedPhoto}
          onClose={() => {
            setSelectedPhoto(null);
            setSelectedIndex(-1);
          }}
          onPrevious={selectedIndex > 0 ? handlePrevious : undefined}
          onNext={selectedIndex < photos.length - 1 ? handleNext : undefined}
        />
      )}
    </div>
  );
}
