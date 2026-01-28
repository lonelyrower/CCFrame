'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';

interface Tag {
  id: string;
  name: string;
  count: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setError(null);
      const response = await fetchWithTimeout('/api/tags');

      if (!response.ok) {
        console.error('Failed to fetch tags:', response.status);
        setError('加载失败');
        return;
      }

      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      setError(error instanceof DOMException ? '请求超时' : '加载失败');
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsPageLoaded(true), 100);
    }
  };

  const maxCount = tags.reduce((max, tag) => Math.max(max, tag.count), 0);

  // Calculate font size based on count (tag cloud effect)
  const getFontSize = (count: number) => {
    const minSize = 14;
    const maxSize = 32;
    if (maxCount <= 0) return `${minSize}px`;
    const size = minSize + (count / maxCount) * (maxSize - minSize);
    return `${size}px`;
  };

  return (
    <div className="min-h-[100dvh] bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with animation */}
        <div className={`mb-16 text-center transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)] mb-3">
            探索
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-4 leading-tight">
            标签
          </h1>
          <p className="text-base md:text-lg font-light text-[color:var(--ds-muted)] max-w-xl mx-auto">
            按主题分类探索照片，发现感兴趣的内容
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-10">
            <div className="rounded-3xl bg-gradient-to-br from-stone-100 to-stone-50 dark:from-neutral-900 dark:to-neutral-950 ring-1 ring-stone-200/50 dark:ring-neutral-800/50 px-8 py-12 md:px-16 md:py-16">
              <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                {Array.from({ length: 14 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className={`h-11 rounded-full ${index % 4 === 0 ? 'w-32' : index % 3 === 0 ? 'w-28' : 'w-24'}`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-neutral-900 rounded-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-8"
                >
                  <Skeleton className="h-6 w-2/3 rounded-lg" />
                  <Skeleton className="h-4 w-24 rounded-lg mt-4" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <EmptyState
            title="加载失败"
            description={<>暂时无法获取标签，请稍后重试</>}
            icon={
              <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M6 20.25h12a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
            }
            tone="neutral"
            size="lg"
            action={
              <Button onClick={loadTags} variant="primary">
                重新加载
              </Button>
            }
          />
        ) : tags.length === 0 ? (
          <EmptyState
            title="暂无标签"
            description={<>还没有创建任何标签，上传照片后可以添加标签进行分类</>}
            icon={
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            }
            tone="luxury"
            size="lg"
          />
        ) : (
          <>
            {/* Interactive Tag Cloud */}
            <div 
              className={`relative mb-20 overflow-visible rounded-3xl bg-gradient-to-br from-stone-100 to-stone-50 dark:from-neutral-900 dark:to-neutral-950 ring-1 ring-stone-200/50 dark:ring-neutral-800/50 shadow-xl px-8 py-12 md:px-16 md:py-16 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: '200ms' }}
            >
              {/* Decorative gradients */}
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-[var(--ds-accent-5)] to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-[var(--ds-luxury-5)] to-transparent pointer-events-none" />

              <div className="relative flex flex-wrap justify-center items-center gap-4 md:gap-6">
                {tags.map((tag, index) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className="group inline-block px-6 py-3 rounded-full bg-white dark:bg-neutral-800 ring-1 ring-stone-200 dark:ring-neutral-700 hover:ring-[color:var(--ds-accent)] hover:bg-[color:var(--ds-accent)] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[var(--ds-accent-20)]"
                    style={{ 
                      fontSize: getFontSize(tag.count),
                      animationDelay: `${index * 30}ms`
                    }}
                  >
                    <span className="font-serif tracking-tight text-stone-900 dark:text-stone-50 group-hover:text-white transition-colors duration-300">
                      {tag.name}
                    </span>
                    <span className="ml-2 text-xs font-sans text-[color:var(--ds-muted-soft)] group-hover:text-white/80 transition-colors duration-300">
                      {tag.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tag List */}
            <div className={`transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: '400ms' }}>
              <div className="mb-10 flex items-center gap-4">
                <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-50">
                  全部标签
                </h2>
                <div className="flex-1 h-px bg-stone-200 dark:bg-neutral-800" />
                <span className="text-sm text-[color:var(--ds-muted-soft)]">{tags.length} 个</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tags.map((tag, index) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className="group block p-8 bg-white dark:bg-neutral-900 rounded-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 hover:ring-[color:var(--ds-accent-30)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 card-soft"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl md:text-2xl font-serif font-semibold tracking-tight text-stone-900 dark:text-stone-50 group-hover:text-[color:var(--ds-accent)] transition-colors duration-300">
                        {tag.name}
                      </h3>
                      <span className="text-sm font-sans text-[color:var(--ds-muted-soft)] px-4 py-2 bg-stone-100 dark:bg-neutral-800 rounded-full group-hover:bg-[color:var(--ds-accent-10)] transition-colors duration-300">
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
