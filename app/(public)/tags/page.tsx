'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tag {
  id: string;
  name: string;
  count: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags');

      if (!response.ok) {
        console.error('Failed to fetch tags:', response.status);
        return;
      }

      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate font size based on count (tag cloud effect)
  const getFontSize = (count: number) => {
    const maxCount = Math.max(...tags.map((t) => t.count));
    const minSize = 14;
    const maxSize = 32;
    const size = minSize + (count / maxCount) * (maxSize - minSize);
    return `${size}px`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-serif font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
            标签云
          </h1>
          <p className="font-sans text-gray-600 dark:text-gray-400">
            通过标签探索照片
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">暂无标签</p>
          </div>
        ) : (
          <>
            {/* Tag Cloud */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl ring-1 ring-inset ring-black/5 dark:ring-white/10 shadow-sm px-6 py-10 sm:px-10 md:px-16 md:py-14 mb-12 card-soft">
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className="inline-block px-5 py-2.5 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10 hover:bg-blue-50 dark:hover:bg-white/10 transition-all"
                    style={{ fontSize: getFontSize(tag.count) }}
                  >
                    <span className="text-gray-800 dark:text-gray-200 font-serif tracking-tight">
                      {tag.name}
                    </span>
                    <span className="ml-2 text-xs font-sans text-gray-500 dark:text-gray-400">
                      ({tag.count})
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tag List */}
            <div>
              <h2 className="text-2xl font-serif font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6">
                全部标签
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className="block p-7 md:p-8 bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-inset ring-black/5 dark:ring-white/10 hover:shadow-md transition-all card-soft"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-serif font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                        {tag.name}
                      </h3>
                      <span className="text-sm font-sans text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                        {tag.count} 张
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
