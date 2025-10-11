'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
      const response = await fetch('/api/series');
      const data = await response.json();
      setSeriesList(data.series);
    } catch (error) {
      console.error('Error:', error);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-block mb-3">
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
              Management
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">系列管理</h1>
          <p className="text-stone-600 dark:text-stone-400 font-light">管理照片系列集</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary">
          创建系列
        </Button>
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
      ) : seriesList.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-stone-600 dark:text-stone-400 font-light mb-6">暂无系列</p>
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            创建第一个系列
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesList.map((series) => (
            <div
              key={series.id}
              className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6 hover:ring-[#e63946]/20 dark:hover:ring-[#ff6b7a]/20 hover:shadow-xl transition-all duration-300"
            >
              <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">{series.title}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 font-mono">Slug: {series.slug}</p>
              {series.brand && (
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
                  <span className="font-medium text-[#e63946] dark:text-[#ff6b7a]">品牌：</span>{series.brand}
                </p>
              )}
              {series.summary && (
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 line-clamp-2 leading-relaxed">
                  {series.summary}
                </p>
              )}
              <div className="flex gap-4 text-xs text-stone-500 dark:text-stone-400 mb-4">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#d4af37]" />
                  {series.albumCount} 个相册
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#d4af37]" />
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
                  className="text-[#e63946] dark:text-[#ff6b7a] hover:bg-[#e63946]/10 dark:hover:bg-[#ff6b7a]/10"
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
                <label className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-2">简介</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  placeholder="系列简介（可选）"
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 dark:focus:ring-[#ff6b7a]/20 focus:border-[#e63946] dark:focus:border-[#ff6b7a] transition-all duration-300"
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
