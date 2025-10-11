'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image/utils';

interface Album {
  id: string;
  title: string;
  summary: string | null;
  coverId: string | null;
  photos: Photo[];
  _count: { photos: number };
}

interface Photo {
  id: string;
  fileKey: string;
  title: string | null;
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
  const seriesId = params.id as string;

  const [series, setSeries] = useState<Series | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

  const loadSeries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/series/${seriesId}`);

      if (!response.ok) {
        console.error('Failed to fetch series:', response.status);
        return;
      }

      const data = await response.json();
      setSeries(data.series || null);
    } catch (error) {
      console.error('Error loading series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCoverImage = (album: Album) => {
    if (album.coverId) {
      return getImageUrl(`uploads/cover/${album.coverId}`);
    }
    if (album.photos && album.photos.length > 0) {
      // 相册封面取第一张照片；若为私密则走受保护 API
      return getImageUrl(album.photos[0].fileKey, undefined, { width: 600 });
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/series"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#e63946] dark:text-[#ff6b7a] hover:gap-3 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回系列列表
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[#e63946] dark:border-t-[#ff6b7a]" />
              <span className="text-sm uppercase tracking-widest text-stone-600 dark:text-stone-400 font-light">
                Loading
              </span>
            </div>
          </div>
        ) : !series ? (
          <div className="text-center py-20">
            <p className="text-xl text-stone-600 dark:text-stone-400 font-light">系列不存在</p>
          </div>
        ) : (
          <>
            {/* Header - Editorial Style */}
            <div className="mb-16">
              <div className="inline-block mb-4">
                <span className="text-xs md:text-sm uppercase tracking-[0.2em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
                  Series
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight leading-tight">
                {series.title}
              </h1>
              {series.summary && (
                <p className="text-xl md:text-2xl text-stone-600 dark:text-stone-400 max-w-4xl mb-6 font-light leading-relaxed">
                  {series.summary}
                </p>
              )}
              <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e63946] dark:bg-[#ff6b7a]" />
                <p className="text-base text-stone-500 dark:text-stone-400">
                  {series.albums.length} 个相册
                </p>
              </div>
            </div>

            {/* Albums Grid - Premium Layout */}
            {series.albums.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-stone-600 dark:text-stone-400 font-light">该系列暂无相册</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {series.albums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/albums/${album.id}`}
                    className="group block bg-white dark:bg-neutral-900 rounded-3xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 overflow-hidden hover:ring-[#e63946]/30 dark:hover:ring-[#ff6b7a]/30 transition-all duration-400 hover:shadow-2xl hover:-translate-y-2 card-soft"
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-[4/3] bg-stone-200 dark:bg-neutral-800 overflow-hidden">
                      {getCoverImage(album) ? (
                        <>
                          <img
                            src={getCoverImage(album)!}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {/* Gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-neutral-800 dark:to-neutral-900">
                          <svg
                            className="w-16 h-16 text-stone-400 dark:text-neutral-600"
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
                      <h3 className="text-2xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-3 group-hover:text-[#e63946] dark:group-hover:text-[#ff6b7a] transition-colors duration-300 leading-tight">
                        {album.title}
                      </h3>
                      {album.summary && (
                        <p className="text-base font-sans leading-relaxed text-stone-600 dark:text-stone-400 mb-4 line-clamp-2">
                          {album.summary}
                        </p>
                      )}
                      <div className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                        <span className="w-1 h-1 rounded-full bg-[#d4af37]" />
                        {album._count.photos} 张作品
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
