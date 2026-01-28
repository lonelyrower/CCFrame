'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Masonry } from '@/components/gallery/Masonry';
import { Lightbox } from '@/components/gallery/Lightbox';
import Link from 'next/link';
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

export default function TagDetailPage() {
  const params = useParams();
  const tagName = decodeURIComponent(params.tag as string);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagName]);

  const loadPhotos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(
        `/api/photos?isPublic=true&tag=${encodeURIComponent(tagName)}&limit=100`
      );

      if (!response.ok) {
        console.error('Failed to fetch photos:', response.status);
        setError('加载失败');
        return;
      }

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Error loading photos:', error);
      setError(error instanceof DOMException ? '请求超时' : '加载失败');
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-[100dvh] bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/tags"
            className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--ds-accent)] hover:gap-3 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回标签列表
          </Link>
        </div>

        {/* Header - Fashion Style */}
        <div className="mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs md:text-sm uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
              标签
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-tight">
            #{tagName}
          </h1>
          <p className="text-lg md:text-xl text-[color:var(--ds-muted)] font-light">
            {photos.length} 张作品
          </p>
        </div>

        {/* Photos */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton
                key={index}
                className={`rounded-2xl ${index % 3 === 0 ? 'aspect-[4/5]' : 'aspect-square'}`}
              />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="加载失败"
            description={<>暂时无法获取该标签的作品，请稍后重试</>}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M6 20.25h12a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
            }
            tone="neutral"
            size="sm"
            action={
              <Button onClick={loadPhotos} variant="primary" size="sm">
                重新加载
              </Button>
            }
          />
        ) : photos.length === 0 ? (
          <EmptyState
            title="该标签下暂无作品"
            description={<>试试浏览其他标签，或稍后再来看</>}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            }
            tone="neutral"
            size="sm"
          />
        ) : (
          <Masonry photos={photos} onPhotoClick={handlePhotoClick} />
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
