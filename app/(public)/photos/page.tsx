'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Masonry } from '@/components/gallery/Masonry';
import { Lightbox } from '@/components/gallery/Lightbox';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { PHOTOS_PER_PAGE } from '@/lib/constants';
import { EmptyPhotosIcon } from '@/components/ui/Icons';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';
import { fetchJsonCached } from '@/lib/utils/fetchJsonCached';

interface Photo {
  id: string;
  title: string | null;
  fileKey: string;
  width: number | null;
  height: number | null;
  isPublic: boolean;
  tags: string[];
}

type PhotosApiResponse = {
  photos?: Photo[];
  pagination?: {
    nextCursor?: string | null;
    hasMore?: boolean;
  };
};

function PhotosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataHint, setDataHint] = useState<string | null>(null);
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
      if (query) {
        params.set('q', query);
      }

      const url = `/api/photos?${params}`;
      const isFirstPage = !cursor;

      let data: PhotosApiResponse;
      if (isFirstPage) {
        const result = await fetchJsonCached<PhotosApiResponse>(url, {
          cacheKey: `photos:first:${encodeURIComponent(query || '__all__')}:v1`,
          ttlMs: 5 * 60 * 1000,
        });
        data = result.data;
        setDataHint(result.source === 'cache' ? '离线模式：展示最近缓存的作品' : null);
      } else {
        const response = await fetchWithTimeout(url);

        if (!response.ok) {
          console.error('Failed to fetch photos:', response.status);
          setError('加载失败');
          setHasMore(false);
          return;
        }

        data = await response.json();
      }

      const newPhotos = data.photos ?? [];
      if (newPhotos.length === 0) {
        setHasMore(false);
        return;
      }

      setPhotos((prev) => (isRefresh ? newPhotos : [...prev, ...newPhotos]));
      setNextCursor(data.pagination?.nextCursor || null);
      setHasMore(data.pagination?.hasMore ?? false);
      
      // Trigger page loaded animation after first load
      if (isRefresh || cursor === null) {
        requestAnimationFrame(() => setIsPageLoaded(true));
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      setError(offline ? '离线模式' : error instanceof DOMException ? '请求超时' : '加载失败');
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, query]);

  // 初始加载/搜索变更时刷新
  useEffect(() => {
    setIsPageLoaded(false);
    setNextCursor(null);
    setHasMore(true);
    setPhotos([]);
    setDataHint(null);
    loadPhotos(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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
              {query ? `搜索：${query}` : '全部作品'}
            </h1>
            <div className="flex items-center gap-4">
              <div className="w-12 h-0.5 bg-[color:var(--ds-accent)]" />
              <p className="text-base md:text-lg text-[color:var(--ds-muted)] font-light">
                {isLoading && photos.length === 0 ? '加载中...' : `${photos.length} 张作品`}
              </p>
            </div>
            {dataHint && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 text-xs font-medium tracking-wide text-[color:var(--ds-muted)] ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
                <span className="h-2 w-2 rounded-full bg-[color:var(--ds-accent)]" aria-hidden="true" />
                {dataHint}
              </p>
            )}
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
            title={error === '离线模式' ? '离线模式' : '加载失败'}
            description={
              error === '离线模式'
                ? <>当前网络不可用，恢复连接后可继续浏览作品内容</>
                : <>暂时无法获取照片，请稍后重试</>
            }
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
            title={query ? '未找到匹配作品' : '暂无公开作品'}
            description={
              query ? <>请尝试更换关键词，或返回浏览全部作品</> : <>这里还没有上传任何照片，请稍后再来查看精彩内容</>
            }
            icon={<EmptyPhotosIcon size={72} className="opacity-70" />}
            tone="accent"
            size="lg"
            action={
              query ? (
                <Button
                  onClick={() => {
                    router.push('/photos');
                  }}
                  variant="primary"
                >
                  浏览全部作品
                </Button>
              ) : undefined
            }
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

function PhotosPageFallback() {
  return (
    <div className="min-h-[100dvh] bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 md:mb-16">
          <span className="inline-block text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)] mb-3">
            画廊
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-tight">
            全部作品
          </h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton
              key={index}
              className={`rounded-2xl ${index % 3 === 0 ? 'aspect-[4/5]' : 'aspect-square'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PhotosPage() {
  return (
    <Suspense fallback={<PhotosPageFallback />}>
      <PhotosPageContent />
    </Suspense>
  );
}
