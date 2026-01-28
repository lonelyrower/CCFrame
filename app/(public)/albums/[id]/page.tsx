'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Masonry } from '@/components/gallery/Masonry';
import { Lightbox } from '@/components/gallery/Lightbox';
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

interface Album {
  id: string;
  title: string;
  summary: string | null;
  series: {
    id: string;
    slug: string;
    title: string;
  } | null;
  photos: Photo[];
}

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    loadAlbum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  const loadAlbum = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(`/api/albums/${albumId}`);

      if (!response.ok) {
        console.error('Failed to fetch album:', response.status);
        setError('加载失败');
        return;
      }

      const data = await response.json();
      setAlbum(data.album || null);
    } catch (error) {
      console.error('Error loading album:', error);
      setError(error instanceof DOMException ? '请求超时' : '加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    if (!album) return;
    const index = album.photos.findIndex((p) => p.id === photo.id);
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const handlePrevious = () => {
    if (!album || selectedIndex <= 0) return;
    const prevIndex = selectedIndex - 1;
    setSelectedPhoto(album.photos[prevIndex]);
    setSelectedIndex(prevIndex);
  };

  const handleNext = () => {
    if (!album || selectedIndex >= album.photos.length - 1) return;
    const nextIndex = selectedIndex + 1;
    setSelectedPhoto(album.photos[nextIndex]);
    setSelectedIndex(nextIndex);
  };

  return (
    <div className="min-h-[100dvh] bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb - Fashion Style */}
        <div className="mb-8">
          {album?.series ? (
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <Link
                href="/series"
                className="text-[color:var(--ds-accent)] hover:underline"
              >
                系列
              </Link>
              <svg className="w-4 h-4 text-[color:var(--ds-muted-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link
                href={`/series/${album.series.slug || album.series.id}`}
                className="text-[color:var(--ds-accent)] hover:underline"
              >
                {album.series.title}
              </Link>
              <svg className="w-4 h-4 text-[color:var(--ds-muted-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-[color:var(--ds-muted)]">
                {album.title}
              </span>
            </div>
          ) : (
            <Link
              href="/photos"
              className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--ds-accent)] hover:gap-3 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              返回照片
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-10">
            <div>
              <Skeleton className="h-8 w-24 rounded-full mb-4" />
              <Skeleton className="h-12 w-2/3 rounded-2xl" />
              <Skeleton className="h-5 w-1/2 rounded-xl mt-4" />
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
        ) : error ? (
          <EmptyState
            title="加载失败"
            description={<>暂时无法获取该相册，请稍后重试</>}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M6 20.25h12a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
            }
            tone="neutral"
            size="sm"
            action={
              <Button onClick={loadAlbum} variant="primary" size="sm">
                重新加载
              </Button>
            }
          />
        ) : !album ? (
          <EmptyState
            title="未找到该相册"
            description={<>可能已被删除或暂时不可用</>}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5m-16.5 4.5h16.5m-16.5 4.5h10.5" />
              </svg>
            }
            tone="neutral"
            size="sm"
            action={
              <Link
                href="/photos"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium bg-[color:var(--ds-accent)] text-white hover:bg-[color:var(--ds-accent-strong)] transition-all"
              >
                返回照片
              </Link>
            }
          />
        ) : (
          <>
            {/* Header - Editorial Style */}
            <div className="mb-16">
              <div className="inline-block mb-4">
                <span className="text-xs md:text-sm uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
                  相册
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight leading-tight">
                {album.title}
              </h1>
              {album.summary && (
                <p className="text-xl md:text-2xl text-[color:var(--ds-muted)] max-w-4xl mb-6 font-light leading-relaxed">
                  {album.summary}
                </p>
              )}
              <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[color:var(--ds-accent)]" />
                <p className="text-base text-[color:var(--ds-muted-soft)]">
                  {album.photos.length} 张作品
                </p>
              </div>
            </div>

            {/* Photos */}
            {album.photos.length === 0 ? (
              <EmptyState
                title="相册暂无作品"
                description={<>稍后再来看看，或浏览其他相册</>}
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                }
                tone="neutral"
                size="sm"
                action={
                  <Link
                    href="/photos"
                    className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium bg-[color:var(--ds-accent)] text-white hover:bg-[color:var(--ds-accent-strong)] transition-all"
                  >
                    浏览全部照片
                  </Link>
                }
              />
            ) : (
              <Masonry photos={album.photos} onPhotoClick={handlePhotoClick} />
            )}
          </>
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
          onNext={
            album && selectedIndex < album.photos.length - 1 ? handleNext : undefined
          }
        />
      )}
    </div>
  );
}
