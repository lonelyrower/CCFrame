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
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Editorial Style */}
        <div className="mb-16 text-center">
          <div className="inline-block mb-4">
            <span className="text-xs md:text-sm uppercase tracking-[0.2em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
              Explore
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-4 leading-tight">
            标签云
          </h1>
          <p className="text-lg md:text-xl font-light text-stone-600 dark:text-stone-400">
            通过风格与主题探索作品
          </p>
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
        ) : tags.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-stone-600 dark:text-stone-400 font-light">暂无标签</p>
          </div>
        ) : (
          <>
            {/* Interactive Tag Cloud - Fashion Magazine Style */}
            <div className="relative mb-20 overflow-hidden rounded-3xl bg-gradient-to-br from-stone-100 to-stone-50 dark:from-neutral-900 dark:to-neutral-950 ring-1 ring-stone-200/50 dark:ring-neutral-800/50 shadow-xl px-8 py-12 md:px-16 md:py-16">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-[#e63946]/5 to-transparent dark:from-[#ff6b7a]/8 pointer-events-none" />

              <div className="relative flex flex-wrap justify-center items-center gap-4 md:gap-6">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className="group inline-block px-6 py-3 rounded-full bg-white dark:bg-neutral-800 ring-1 ring-stone-200 dark:ring-neutral-700 hover:ring-[#e63946] dark:hover:ring-[#ff6b7a] hover:bg-[#e63946] dark:hover:bg-[#ff6b7a] transition-all duration-300 hover:scale-110 hover:shadow-lg"
                    style={{ fontSize: getFontSize(tag.count) }}
                  >
                    <span className="font-serif tracking-tight text-stone-900 dark:text-stone-50 group-hover:text-white transition-colors duration-300">
                      {tag.name}
                    </span>
                    <span className="ml-2 text-xs font-sans text-stone-500 dark:text-stone-400 group-hover:text-white/80 transition-colors duration-300">
                      {tag.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Elegant Tag List */}
            <div>
              <div className="mb-10">
                <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50">
                  全部标签
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className="group block p-8 bg-white dark:bg-neutral-900 rounded-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 hover:ring-[#e63946]/30 dark:hover:ring-[#ff6b7a]/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 card-soft"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl md:text-2xl font-serif font-semibold tracking-tight text-stone-900 dark:text-stone-50 group-hover:text-[#e63946] dark:group-hover:text-[#ff6b7a] transition-colors duration-300">
                        {tag.name}
                      </h3>
                      <span className="text-sm font-sans text-stone-500 dark:text-stone-400 px-4 py-2 bg-stone-100 dark:bg-neutral-800 rounded-full group-hover:bg-[#e63946]/10 dark:group-hover:bg-[#ff6b7a]/10 transition-colors duration-300">
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
