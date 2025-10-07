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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/series"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← 返回系列列表
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
          </div>
        ) : !series ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">系列不存在</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
                {series.title}
              </h1>
              {series.summary && (
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl">
                  {series.summary}
                </p>
              )}
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {series.albums.length} 个相册
              </p>
            </div>

            {/* Albums Grid */}
            {series.albums.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">该系列暂无相册</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {series.albums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/albums/${album.id}`}
                    className="group block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    {/* Cover */}
                    <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      {getCoverImage(album) ? (
                        <img
                          src={getCoverImage(album)!}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {album.title}
                      </h3>
                      {album.summary && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {album.summary}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {album._count.photos} 张照片
                      </p>
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
