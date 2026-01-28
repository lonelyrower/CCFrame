'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Masonry } from '@/components/gallery/Masonry';
import { Lightbox } from '@/components/gallery/Lightbox';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { PHOTOS_PER_PAGE } from '@/lib/constants';
import { EmptyPhotosIcon } from '@/components/ui/Icons';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';

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
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 使用游标分页加载照片（O(1) 性能）
  const loadPhotos = useCallback(async (cursor?: string | null, isRefresh = false) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        isPublic: 'true',
        limit: String(PHOTOS_PER_PAGE),
      });
      if (cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetchWithTimeout(`/api/photos?${params}`);

      if (!response.ok) {
        console.error('Failed to fetch photos:', response.status);
        setError('加载失败');
        setHasMore(false);
        return;
      }

      const data = await response.json();

      if (!data.photos || data.photos.length === 0) {
        setHasMore(false);
        return;
      }

      setPhotos((prev) => (isRefresh ? data.photos : [...prev, ...data.photos]));
      setNextCursor(data.pagination?.nextCursor || null);
      setHasMore(data.pagination?.hasMore ?? false);
      
      // Trigger page loaded animation after first load
      if (isRefresh || cursor === null) {
        setTimeout(() => setIsPageLoaded(true), 100);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      setError(error instanceof DOMException ? '请求超时' : '加载失败');
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // 初始加载
  useEffect(() => {
    loadPhotos(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 无限滚动观察器
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && nextCursor) {
          loadPhotos(nextCursor);
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
  }, [hasMore, isLoading, nextCursor, loadPhotos]);

  const handlePhotoClick = (photo: Photo) => {
    const index = photos.findIndex((p) => p.id === photo.id);
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const handleRefresh = async () => {
    setNextCursor(null);
    setHasMore(true);
    setPhotos([]);
    await loadPhotos(null, true);
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
    <PullToRefresh onRefresh={handleRefresh} disabled={isLoading}>
      <div className="min-h-[100dvh] bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with animation */}
          <div className={`mb-12 md:mb-16 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-block text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)] mb-3">
              画廊
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-tight">
              全部作品
            </h1>
            <div className="flex items-center gap-4">
              <div className="w-12 h-0.5 bg-[color:var(--ds-accent)]" />
              <p className="text-base md:text-lg text-[color:var(--ds-muted)] font-light">
                {isLoading && photos.length === 0 ? '加载中...' : `${photos.length} 张作品`}
              </p>
            </div>
          </div>

        {/* Initial Loading State */}
        {isLoading && photos.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton
                key={index}
                className={`rounded-2xl ${index % 3 === 0 ? 'aspect-[4/5]' : 'aspect-square'}`}
              />
            ))}
          </div>
        ) : error && photos.length === 0 ? (
          <EmptyState
            title="加载失败"
            description={<>暂时无法获取照片，请稍后重试</>}
            icon={<EmptyPhotosIcon size={64} className="opacity-70" />}
            tone="neutral"
            size="md"
            action={
              <Button onClick={() => loadPhotos(null, true)} variant="primary">
                重新加载
              </Button>
            }
          />
        ) : photos.length > 0 ? (
          <div className={`transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
            <Masonry photos={photos} onPhotoClick={handlePhotoClick} />
          </div>
        ) : (
          <EmptyState
            title="暂无公开作品"
            description={<>这里还没有上传任何照片，请稍后再来查看精彩内容</>}
            icon={<EmptyPhotosIcon size={72} className="opacity-70" />}
            tone="accent"
            size="lg"
          />
        )}

        {/* Load More Indicator */}
        {hasMore && photos.length > 0 && (
          <div ref={loadMoreRef} className="mt-12 text-center py-8">
            {isLoading && (
              <div className="inline-flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full border-2 border-stone-200 dark:border-neutral-800" />
                  <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-transparent border-t-[color:var(--ds-accent)] animate-spin" />
                </div>
                <span className="text-xs uppercase tracking-widest text-[color:var(--ds-muted-soft)] font-light">
                  加载更多
                </span>
              </div>
            )}
          </div>
        )}

          {!hasMore && photos.length > 0 && (
            <div className="mt-12 text-center py-12">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-px bg-stone-300 dark:bg-neutral-700" />
                  <div className="w-2 h-2 rounded-full bg-[color:var(--ds-accent-30)]" />
                  <div className="w-8 h-px bg-stone-300 dark:bg-neutral-700" />
                </div>
                <p className="text-sm uppercase tracking-widest text-[color:var(--ds-muted-soft)] font-light">
                  已加载全部作品
                </p>
              </div>
            </div>
          )}
        </div>
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
    </PullToRefresh>
  );
}
