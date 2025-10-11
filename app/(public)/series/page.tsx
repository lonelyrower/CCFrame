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

      if (!response.ok) {
        console.error('Failed to fetch series:', response.status);
        return;
      }

      const data = await response.json();
      setSeriesList(data.series || []);
    } catch (error) {
      console.error('Error loading series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Editorial Style */}
        <div className="mb-16 text-center">
          <div className="inline-block mb-4">
            <span className="text-xs md:text-sm uppercase tracking-[0.2em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
              Collections
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-4 leading-tight">
            系列集
          </h1>
          <p className="text-lg md:text-xl font-light text-stone-600 dark:text-stone-400">
            按主题与品牌浏览精选作品集
          </p>
        </div>

        {/* Series Grid - Large Card Layout */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[#e63946] dark:border-t-[#ff6b7a]" />
              <span className="text-sm uppercase tracking-widest text-stone-600 dark:text-stone-400 font-light">
                Loading
              </span>
            </div>
          </div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-stone-600 dark:text-stone-400 font-light">暂无系列</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {seriesList.map((series) => (
              <Link
                key={series.id}
                href={`/series/${series.id}`}
                className="group block bg-white dark:bg-neutral-900 rounded-3xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 overflow-hidden hover:ring-[#e63946]/30 dark:hover:ring-[#ff6b7a]/30 transition-all duration-400 hover:shadow-2xl hover:-translate-y-2 card-soft"
              >
                {/* Cover Image - Premium Style */}
                <div className="relative aspect-[4/3] bg-stone-200 dark:bg-neutral-800 overflow-hidden">
                  {series.coverId ? (
                    <>
                      <img
                        src={cfImage(`/uploads/cover/${series.coverId}`, {
                          width: 800,
                          quality: 90,
                        })}
                        alt={series.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-neutral-800 dark:to-neutral-900">
                      <svg
                        className="w-20 h-20 text-stone-400 dark:text-neutral-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content - Refined Typography */}
                <div className="p-8">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-3 group-hover:text-[#e63946] dark:group-hover:text-[#ff6b7a] transition-colors duration-300 leading-tight">
                    {series.title}
                  </h2>
                  {series.summary && (
                    <p className="font-sans text-base leading-relaxed text-stone-600 dark:text-stone-400 mb-6 line-clamp-2">
                      {series.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm font-sans text-stone-500 dark:text-stone-400">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#e63946] dark:bg-[#ff6b7a]" />
                      {series.albumCount} 相册
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#d4af37]" />
                      {series.photoCount} 作品
                    </span>
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
