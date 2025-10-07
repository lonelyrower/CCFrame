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
          <h1 className="text-3xl font-serif font-bold">系列管理</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">管理照片系列集</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary">
          创建系列
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
        </div>
      ) : seriesList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">暂无系列</p>
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            创建第一个系列
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesList.map((series) => (
            <div
              key={series.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <h3 className="text-xl font-bold mb-2">{series.title}</h3>
              <p className="text-sm text-gray-500 mb-3">Slug: {series.slug}</p>
              {series.brand && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">品牌：</span>{series.brand}
                </p>
              )}
              {series.summary && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {series.summary}
                </p>
              )}
              <div className="flex gap-4 text-sm text-gray-500 mb-4">
                <span>{series.albumCount} 个相册</span>
                <span>{series.photoCount} 张照片</span>
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
                  className="text-red-600"
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreateModal || editingSeries) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-2xl font-bold mb-6">
              {editingSeries ? '编辑系列' : '创建系列'}
            </h2>
            <div className="space-y-4">
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
                <label className="block text-sm font-medium mb-1">简介</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  placeholder="系列简介（可选）"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
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
                variant="ghost"
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
