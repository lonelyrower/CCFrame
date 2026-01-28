'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProgressiveImage } from '@/components/media/ProgressiveImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';

interface Album {
  id: string;
  title: string;
  summary: string | null;
  coverId: string | null;
  coverPhoto?: {
    id: string;
    fileKey: string;
    isPublic: boolean;
    dominantColor: string | null;
    width: number | null;
    height: number | null;
  } | null;
  photos: Photo[];
  _count: { photos: number };
}

interface Photo {
  id: string;
  fileKey: string;
  title: string | null;
  isPublic: boolean;
}

interface Series {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  albums: Album[];
}

export default function SeriesDetailPage() {
  const params = useParams();
  const seriesSlug = params.id as string;

  const [series, setSeries] = useState<Series | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesSlug]);

  const loadSeries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(`/api/series/${seriesSlug}`);

      if (!response.ok) {
        console.error('Failed to fetch series:', response.status);
        setError('加载失败');
        return;
      }

      const data = await response.json();
      setSeries(data.series || null);
    } catch (error) {
      console.error('Error loading series:', error);
      setError(error instanceof DOMException ? '请求超时' : '加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getCoverPhoto = (album: Album) => {
    if (album.coverPhoto) {
      return album.coverPhoto;
    }
    if (album.photos && album.photos.length > 0) {
      return {
        fileKey: album.photos[0].fileKey,
        isPublic: album.photos[0].isPublic,
      };
    }
    return null;
  };

  return (
    <div className="min-h-[100dvh] bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/series"
            className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--ds-accent)] hover:gap-3 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回系列列表
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <div>
              <Skeleton className="h-8 w-24 rounded-full mb-4" />
              <Skeleton className="h-12 w-2/3 rounded-2xl" />
              <Skeleton className="h-5 w-1/2 rounded-xl mt-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-neutral-900 rounded-3xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 overflow-hidden"
                >
                  <Skeleton className="w-full aspect-[4/3]" />
                  <div className="p-8 space-y-4">
                    <Skeleton className="h-6 w-2/3 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <EmptyState
            title="加载失败"
            description={<>暂时无法获取该系列，请稍后重试</>}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M6 20.25h12a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
            }
            tone="neutral"
            size="sm"
            action={
              <Button onClick={loadSeries} variant="primary" size="sm">
                重新加载
              </Button>
            }
          />
        ) : !series ? (
          <EmptyState
            title="未找到该系列"
            description={<>可能已被删除或暂时不可用</>}
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M6 20.25h12a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
            }
            tone="neutral"
            size="sm"
            action={
              <Link
                href="/series"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium bg-[color:var(--ds-accent)] text-white hover:bg-[color:var(--ds-accent-strong)] transition-all"
              >
                返回系列列表
              </Link>
            }
          />
        ) : (
          <>
            {/* Header - Editorial Style */}
            <div className="mb-16">
              <div className="inline-block mb-4">
                <span className="text-xs md:text-sm uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
                  系列
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight leading-tight">
                {series.title}
              </h1>
              {series.summary && (
                <p className="text-xl md:text-2xl text-[color:var(--ds-muted)] max-w-4xl mb-6 font-light leading-relaxed">
                  {series.summary}
                </p>
              )}
              <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[color:var(--ds-accent)]" />
                <p className="text-base text-[color:var(--ds-muted-soft)]">
                  {series.albums.length} 个相册
                </p>
              </div>
            </div>

            {/* Albums Grid - Premium Layout */}
            {series.albums.length === 0 ? (
              <EmptyState
                title="该系列暂无相册"
                description={<>稍后再来看看，或前往其他系列</>}
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5m-16.5 4.5h16.5m-16.5 4.5h10.5" />
                  </svg>
                }
                tone="neutral"
                size="sm"
                action={
                  <Link
                    href="/series"
                    className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium bg-[color:var(--ds-accent)] text-white hover:bg-[color:var(--ds-accent-strong)] transition-all"
                  >
                    浏览其他系列
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {series.albums.map((album) => {
                  const coverPhoto = getCoverPhoto(album);
                  return (
                    <Link
                      key={album.id}
                      href={`/albums/${album.id}`}
                    className="group block bg-white dark:bg-neutral-900 rounded-3xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 overflow-hidden hover:ring-[color:var(--ds-accent-30)] transition-all duration-400 hover:shadow-2xl hover:-translate-y-2 card-soft"
                    >
                      {/* Cover Image */}
                      <div className="relative aspect-[4/3] bg-stone-200 dark:bg-neutral-800 overflow-hidden">
                        {coverPhoto ? (
                          <>
                            <ProgressiveImage
                              fileKey={coverPhoto.fileKey}
                              isPublic={coverPhoto.isPublic}
                              alt={album.title}
                              className="absolute inset-0"
                              imgClassName="transition-transform duration-500 group-hover:scale-110"
                              highResOptions={{ width: 1200, quality: 88 }}
                              lowResOptions={{ width: 96, quality: 40 }}
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-neutral-800 dark:to-neutral-900">
                            <svg
                              className="w-16 h-16 text-[color:var(--ds-muted-soft)]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                    {/* Content */}
                    <div className="p-8">
                      <h3 className="text-2xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-3 group-hover:text-[color:var(--ds-accent)] transition-colors duration-300 leading-tight">
                        {album.title}
                      </h3>
                      {album.summary && (
                        <p className="text-base font-sans leading-relaxed text-[color:var(--ds-muted)] mb-4 line-clamp-2">
                          {album.summary}
                        </p>
                      )}
                      <div className="inline-flex items-center gap-1.5 text-sm text-[color:var(--ds-muted-soft)]">
                        <span className="w-1 h-1 rounded-full bg-[color:var(--ds-luxury)]" />
                        {album._count.photos} 张作品
                      </div>
                    </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
