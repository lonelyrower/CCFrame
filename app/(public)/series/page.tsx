'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProgressiveImage } from '@/components/media/ProgressiveImage';

interface Series {
  id: string;
  slug: string;
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
  albumCount: number;
  photoCount: number;
}

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

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
      setTimeout(() => setIsPageLoaded(true), 100);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with animation */}
        <div className={`mb-16 text-center transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-luxury)] mb-3">
            Collections
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-4 leading-tight">
            系列
          </h1>
          <p className="text-base md:text-lg font-light text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
            精心策划的主题作品集，探索不同的视觉故事
          </p>
        </div>

        {/* Series Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-stone-200 dark:border-neutral-800" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-[color:var(--ds-accent)] animate-spin" />
              </div>
              <span className="text-sm uppercase tracking-widest text-stone-600 dark:text-stone-400 font-light">
                Loading
              </span>
            </div>
          </div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-32">
            <div className="max-w-md mx-auto">
              <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-400/10 to-stone-400/5 dark:from-stone-400/15 dark:to-stone-400/5 flex items-center justify-center">
                  <svg className="w-10 h-10 text-stone-700 dark:text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-semibold text-stone-900 dark:text-stone-50 mb-4">
                暂无系列
              </h3>
              <p className="text-base md:text-lg text-stone-600 dark:text-stone-400 font-light leading-relaxed">
                还没有创建任何系列，<br/>可以将相关照片组织成主题系列
              </p>
            </div>
          </div>
        ) : (
          <div 
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            style={{ transitionDelay: '200ms' }}
          >
            {seriesList.map((series, index) => (
              <Link
                key={series.id}
                href={`/series/${series.slug || series.id}`}
                className="group block bg-white dark:bg-neutral-900 rounded-3xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 overflow-hidden hover:ring-[color:var(--ds-accent-30)] transition-all duration-400 hover:shadow-2xl hover:-translate-y-2 card-soft"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Cover Image */}
                <div className="relative aspect-[4/3] bg-stone-200 dark:bg-neutral-800 overflow-hidden">
                  {series.coverPhoto ? (
                    <>
                      <ProgressiveImage
                        fileKey={series.coverPhoto.fileKey}
                        isPublic={series.coverPhoto.isPublic}
                        alt={series.title}
                        className="absolute inset-0"
                        imgClassName="transition-transform duration-700 group-hover:scale-110"
                        highResOptions={{ width: 1200, quality: 88 }}
                        lowResOptions={{ width: 96, quality: 40 }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                      {/* View indicator */}
                      <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        查看系列 →
                      </div>
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

                {/* Content */}
                <div className="p-8">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-3 group-hover:text-[color:var(--ds-accent)] transition-colors duration-300 leading-tight">
                    {series.title}
                  </h2>
                  {series.summary && (
                    <p className="font-sans text-base leading-relaxed text-stone-600 dark:text-stone-400 mb-6 line-clamp-2">
                      {series.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm font-sans text-stone-500 dark:text-stone-400">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--ds-accent)]" />
                      {series.albumCount} 相册
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--ds-luxury)]" />
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
