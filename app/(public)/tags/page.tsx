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
      const data = await response.json();
      setTags(data.tags);
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
          <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
            标签云
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 mb-12">
              <div className="flex flex-wrap justify-center gap-4">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className="inline-block px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    style={{ fontSize: getFontSize(tag.count) }}
                  >
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {tag.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      ({tag.count})
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tag List */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                全部标签
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {tag.name}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
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
