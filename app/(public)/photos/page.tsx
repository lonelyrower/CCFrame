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
  isPublic: boolean;
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

      if (!response.ok) {
        console.error('Failed to fetch photos:', response.status);
        setHasMore(false);
        return;
      }

      const data = await response.json();

      if (!data.photos || data.photos.length === 0) {
        setHasMore(false);
        return;
      }

      setPhotos((prev) => (pageNum === 1 ? data.photos : [...prev, ...data.photos]));
      setHasMore(data.pagination?.page < data.pagination?.totalPages);
    } catch (error) {
      console.error('Error loading photos:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    loadPhotos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Clean Style */}
        <div className="mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-tight">
            全部作品
          </h1>
          <p className="text-base md:text-lg text-stone-600 dark:text-stone-400 font-light">
            {photos.length > 0 ? `${photos.length} 张作品` : '加载中...'}
          </p>
        </div>

        {/* Masonry Grid */}
        {photos.length > 0 ? (
          <Masonry photos={photos} onPhotoClick={handlePhotoClick} />
        ) : (
          !isLoading && (
            <div className="text-center py-32">
              <div className="max-w-md mx-auto">
                {/* Empty state icon */}
                <div className="mb-8 flex justify-center">
                  <div className="relative w-32 h-32 opacity-20">
                    <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="64" cy="64" r="40" stroke="currentColor" strokeWidth="2" className="text-[#e63946] dark:text-[#ff6b7a]"/>
                      <circle cx="64" cy="64" r="28" stroke="currentColor" strokeWidth="1.5" className="text-[#d4af37]"/>
                      <path d="M24 24 L24 40 M24 24 L40 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-stone-400 dark:text-stone-600"/>
                      <path d="M104 104 L104 88 M104 104 L88 104" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-stone-400 dark:text-stone-600"/>
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl md:text-3xl font-serif font-semibold text-stone-900 dark:text-stone-50 mb-4">
                  暂无公开作品
                </h3>
                <p className="text-lg text-stone-600 dark:text-stone-400 font-light leading-relaxed mb-8">
                  这里还没有上传任何照片，<br/>请稍后再来查看精彩内容
                </p>
              </div>
            </div>
          )
        )}

        {/* Load More Indicator - Minimal Design */}
        {hasMore && (
          <div ref={loadMoreRef} className="mt-12 text-center py-12">
            {isLoading && (
              <div className="inline-flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[#e63946] dark:border-t-[#ff6b7a]" />
                <span className="text-sm uppercase tracking-widest text-stone-600 dark:text-stone-400 font-light">
                  Loading
                </span>
              </div>
            )}
          </div>
        )}

        {!hasMore && photos.length > 0 && (
          <div className="mt-12 text-center py-12">
            <div className="inline-block">
              <div className="w-16 h-px bg-stone-300 dark:bg-neutral-700 mb-4" />
              <p className="text-sm uppercase tracking-widest text-stone-500 dark:text-stone-400 font-light">
                已加载全部作品
              </p>
            </div>
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
