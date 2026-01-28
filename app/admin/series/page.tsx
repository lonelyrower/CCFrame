'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';

interface Series {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  brand: string | null;
  albumCount: number;
  photoCount: number;
}

export default function SeriesManagementPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [brand, setBrand] = useState('');

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      setError(null);
      const response = await fetchWithTimeout('/api/series');
      if (!response.ok) {
        setError('加载失败');
        return;
      }
      const data = await response.json();
      setSeriesList(data.series);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof DOMException ? '请求超时' : '加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title, summary: summary || null, brand: brand || null }),
      });

      if (response.ok) {
        await loadSeries();
        resetForm();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingSeries) return;

    try {
      const response = await fetch(`/api/series/${editingSeries.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title, summary: summary || null, brand: brand || null }),
      });

      if (response.ok) {
        await loadSeries();
        resetForm();
        setEditingSeries(null);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此系列？')) return;

    try {
      await fetch(`/api/series/${id}`, { method: 'DELETE' });
      await loadSeries();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const startEdit = (series: Series) => {
    setEditingSeries(series);
    setSlug(series.slug);
    setTitle(series.title);
    setSummary(series.summary || '');
    setBrand(series.brand || '');
  };

  const resetForm = () => {
    setSlug('');
    setTitle('');
    setSummary('');
    setBrand('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="inline-block mb-3">
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
              管理
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">系列管理</h1>
          <p className="text-[color:var(--ds-muted)] font-light">管理照片系列集</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary" className="w-full sm:w-auto">
          创建系列
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-900 rounded-3xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6"
            >
              <Skeleton className="h-6 w-2/3 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg mt-3" />
              <Skeleton className="h-4 w-full rounded-lg mt-4" />
              <Skeleton className="h-4 w-1/2 rounded-lg mt-2" />
              <div className="flex gap-2 mt-5">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="加载失败"
          description={<>暂时无法获取系列信息，请稍后重试</>}
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M6 20.25h12a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          }
          tone="neutral"
          size="md"
          action={
            <Button onClick={loadSeries} variant="primary">
              重新加载
            </Button>
          }
        />
      ) : seriesList.length === 0 ? (
        <EmptyState
          title="暂无系列"
          description={<>用系列来组织相册与主题内容</>}
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
            </svg>
          }
          tone="accent"
          size="md"
          action={
            <Button onClick={() => setShowCreateModal(true)} variant="primary">
              创建第一个系列
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesList.map((series) => (
            <div
              key={series.id}
              className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6 hover:ring-[color:var(--ds-accent-20)] hover:shadow-xl transition-all duration-300"
            >
              <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">{series.title}</h3>
              <p className="text-xs text-[color:var(--ds-muted-soft)] mb-3 font-mono">标识: {series.slug}</p>
              {series.brand && (
                <p className="text-sm text-[color:var(--ds-muted)] mb-2">
                  <span className="font-medium text-[color:var(--ds-accent)]">品牌：</span>{series.brand}
                </p>
              )}
              {series.summary && (
                <p className="text-sm text-[color:var(--ds-muted)] mb-4 line-clamp-2 leading-relaxed">
                  {series.summary}
                </p>
              )}
              <div className="flex gap-4 text-xs text-[color:var(--ds-muted-soft)] mb-4">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[color:var(--ds-luxury)]" />
                  {series.albumCount} 个相册
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[color:var(--ds-luxury)]" />
                  {series.photoCount} 张照片
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => startEdit(series)}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  编辑
                </Button>
                <Button
                  onClick={() => handleDelete(series.id)}
                  variant="ghost"
                  size="sm"
                  className="text-[color:var(--ds-accent)] hover:bg-[color:var(--ds-accent-10)]"
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreateModal || editingSeries) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 max-w-lg w-full p-8">
            <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight">
              {editingSeries ? '编辑系列' : '创建系列'}
            </h2>
            <div className="space-y-5">
              <Input
                label="Slug (URL 标识)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-series"
                required
              />
              <Input
                label="系列标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="我的系列"
                required
              />
              <Input
                label="品牌"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="品牌名称（可选）"
              />
              <div>
                <label className="block text-sm font-medium tracking-wide text-[color:var(--ds-muted)] mb-2">简介</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  placeholder="系列简介（可选）"
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-[color:var(--ds-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button
                onClick={editingSeries ? handleUpdate : handleCreate}
                variant="primary"
                className="flex-1"
                disabled={!slug.trim() || !title.trim()}
              >
                {editingSeries ? '保存' : '创建'}
              </Button>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSeries(null);
                  resetForm();
                }}
                variant="secondary"
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
