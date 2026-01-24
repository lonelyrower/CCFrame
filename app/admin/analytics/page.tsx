'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  traffic: {
    totalPV: number;
    totalUV: number;
    avgPVperDay: number;
  };
  library: {
    totalPhotos: number;
    publicPhotos: number;
    privatePhotos: number;
    recentUploads: number;
  };
  topTags: Array<{ id: string; name: string; count: number }>;
  topAlbums: Array<{ id: string; title: string; count: number }>;
  topSeries: Array<{ id: string; title: string; count: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState(7);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/metrics/summary?range=${range}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="inline-block mb-3">
            <span className="text-xs tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
              统计
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">
            数据统计
          </h1>
          <p className="text-stone-600 dark:text-stone-400 font-light">
            网站访问和内容统计
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(parseInt(e.target.value))}
          aria-label="选择时间范围"
          className="w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
        >
          <option value={7}>近 7 天</option>
          <option value={30}>近 30 天</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[color:var(--ds-accent)]" />
            <span className="text-sm tracking-widest text-stone-600 dark:text-stone-400 font-light">
              加载中
            </span>
          </div>
        </div>
      ) : !data ? (
        <div className="text-center py-20">
          <p className="text-xl text-stone-600 dark:text-stone-400 font-light">加载失败</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Traffic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6 hover:ring-[color:var(--ds-accent-20)] transition-all duration-300">
              <div className="text-sm font-medium tracking-wide text-stone-600 dark:text-stone-400 mb-2 uppercase">
                总访问量 (PV)
              </div>
              <div className="text-4xl font-serif font-bold text-[color:var(--ds-accent)] mb-2">
                {data.traffic.totalPV.toLocaleString()}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[color:var(--ds-luxury)]" />
                日均 {data.traffic.avgPVperDay.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6 hover:ring-[color:var(--ds-accent-20)] transition-all duration-300">
              <div className="text-sm font-medium tracking-wide text-stone-600 dark:text-stone-400 mb-2 uppercase">
                独立访客 (UV)
              </div>
              <div className="text-4xl font-serif font-bold text-[color:var(--ds-accent)]">
                {data.traffic.totalUV.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6 hover:ring-[color:var(--ds-accent-20)] transition-all duration-300">
              <div className="text-sm font-medium tracking-wide text-stone-600 dark:text-stone-400 mb-2 uppercase">
                近 30 天上传
              </div>
              <div className="text-4xl font-serif font-bold text-[color:var(--ds-accent)] mb-2">
                {data.library.recentUploads}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">张照片</div>
            </div>
          </div>

          {/* Library Stats */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight">照片库统计</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium tracking-wide text-stone-600 dark:text-stone-400 mb-2">
                  总照片数
                </div>
                <div className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-50">
                  {data.library.totalPhotos}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium tracking-wide text-stone-600 dark:text-stone-400 mb-2">
                  公开照片
                </div>
                <div className="text-3xl font-serif font-bold text-[color:var(--ds-accent)]">
                  {data.library.publicPhotos}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium tracking-wide text-stone-600 dark:text-stone-400 mb-2">
                  私密照片
                </div>
                <div className="text-3xl font-serif font-bold text-[color:var(--ds-luxury)]">
                  {data.library.privatePhotos}
                </div>
              </div>
            </div>
          </div>

          {/* Top Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Tags */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6">
              <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-4 tracking-tight">热门标签 Top 10</h3>
              <div className="space-y-3">
                {data.topTags.map((tag, index) => (
                  <div key={tag.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-neutral-800 transition-colors">
                    <span className="text-sm text-stone-700 dark:text-stone-300">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[color:var(--ds-accent-10)] text-[color:var(--ds-accent)] text-xs font-bold mr-2">
                        {index + 1}
                      </span>
                      {tag.name}
                    </span>
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400">{tag.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Albums */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6">
              <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-4 tracking-tight">热门相册 Top 10</h3>
              <div className="space-y-3">
                {data.topAlbums.map((album, index) => (
                  <div key={album.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-neutral-800 transition-colors">
                    <span className="text-sm text-stone-700 dark:text-stone-300 truncate">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[color:var(--ds-accent-10)] text-[color:var(--ds-accent)] text-xs font-bold mr-2">
                        {index + 1}
                      </span>
                      {album.title}
                    </span>
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 ml-2">{album.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Series */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6">
              <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-4 tracking-tight">热门系列 Top 10</h3>
              <div className="space-y-3">
                {data.topSeries.map((series, index) => (
                  <div key={series.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-neutral-800 transition-colors">
                    <span className="text-sm text-stone-700 dark:text-stone-300 truncate">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[color:var(--ds-accent-10)] text-[color:var(--ds-accent)] text-xs font-bold mr-2">
                        {index + 1}
                      </span>
                      {series.title}
                    </span>
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 ml-2">{series.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
