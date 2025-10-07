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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">数据统计</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            网站访问和内容统计
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(parseInt(e.target.value))}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        >
          <option value={7}>近 7 天</option>
          <option value={30}>近 30 天</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
        </div>
      ) : !data ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">加载失败</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Traffic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                总访问量 (PV)
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {data.traffic.totalPV.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                日均 {data.traffic.avgPVperDay.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                独立访客 (UV)
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {data.traffic.totalUV.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                近 30 天上传
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {data.library.recentUploads}
              </div>
              <div className="text-xs text-gray-500 mt-2">张照片</div>
            </div>
          </div>

          {/* Library Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">照片库统计</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  总照片数
                </div>
                <div className="text-2xl font-bold">
                  {data.library.totalPhotos}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  公开照片
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {data.library.publicPhotos}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  私密照片
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {data.library.privatePhotos}
                </div>
              </div>
            </div>
          </div>

          {/* Top Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">热门标签 Top 10</h3>
              <div className="space-y-2">
                {data.topTags.map((tag, index) => (
                  <div key={tag.id} className="flex items-center justify-between">
                    <span className="text-sm">
                      {index + 1}. {tag.name}
                    </span>
                    <span className="text-xs text-gray-500">{tag.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Albums */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">热门相册 Top 10</h3>
              <div className="space-y-2">
                {data.topAlbums.map((album, index) => (
                  <div key={album.id} className="flex items-center justify-between">
                    <span className="text-sm truncate">
                      {index + 1}. {album.title}
                    </span>
                    <span className="text-xs text-gray-500">{album.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Series */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">热门系列 Top 10</h3>
              <div className="space-y-2">
                {data.topSeries.map((series, index) => (
                  <div key={series.id} className="flex items-center justify-between">
                    <span className="text-sm truncate">
                      {index + 1}. {series.title}
                    </span>
                    <span className="text-xs text-gray-500">{series.count}</span>
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
