'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cfImage } from '@/lib/cf-image';

interface Series {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverId: string | null;
  albumCount: number;
  photoCount: number;
}

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const response = await fetch('/api/series');
      const data = await response.json();
      setSeriesList(data.series);
    } catch (error) {
      console.error('Error loading series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
            系列集
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            按主题或品牌浏览精选作品集
          </p>
        </div>

        {/* Series Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
          </div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">暂无系列</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {seriesList.map((series) => (
              <Link
                key={series.id}
                href={`/series/${series.id}`}
                className="group block bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Cover Image */}
                <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  {series.coverId ? (
                    <img
                      src={cfImage(`/uploads/cover/${series.coverId}`, {
                        width: 600,
                        quality: 85,
                      })}
                      alt={series.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {series.title}
                  </h2>
                  {series.summary && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {series.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{series.albumCount} 个相册</span>
                    <span>•</span>
                    <span>{series.photoCount} 张照片</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
