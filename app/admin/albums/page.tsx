'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';

interface Album {
  id: string;
  title: string;
  summary: string | null;
  photoCount: number;
  series: { id: string; title: string } | null;
}

interface Series {
  id: string;
  title: string;
}

export default function AlbumsManagementPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [albumsRes, seriesRes] = await Promise.all([
        fetchWithTimeout('/api/albums'),
        fetchWithTimeout('/api/series'),
      ]);
      if (!albumsRes.ok || !seriesRes.ok) {
        setError('加载失败');
        return;
      }
      const albumsData = await albumsRes.json();
      const seriesData = await seriesRes.json();
      setAlbums(albumsData.albums);
      setSeries(seriesData.series);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof DOMException ? '请求超时' : '加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary: summary || null,
          seriesId: selectedSeriesId || null,
        }),
      });

      if (response.ok) {
        await loadData();
        resetForm();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating album:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingAlbum) return;

    try {
      const response = await fetch(`/api/albums/${editingAlbum.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary: summary || null,
          seriesId: selectedSeriesId || null,
        }),
      });

      if (response.ok) {
        await loadData();
        resetForm();
        setEditingAlbum(null);
      }
    } catch (error) {
      console.error('Error updating album:', error);
    }
  };

  const handleDelete = async (albumId: string) => {
    if (!confirm('确定删除此相册？')) return;

    try {
      await fetch(`/api/albums/${albumId}`, { method: 'DELETE' });
      await loadData();
    } catch (error) {
      console.error('Error deleting album:', error);
    }
  };

  const startEdit = (album: Album) => {
    setEditingAlbum(album);
    setTitle(album.title);
    setSummary(album.summary || '');
    setSelectedSeriesId(album.series?.id || '');
  };

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setSelectedSeriesId('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="inline-block mb-3">
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-[color:var(--ds-accent)]">
              管理
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">
            相册管理
          </h1>
          <p className="text-[color:var(--ds-muted)] font-light">
            创建和管理照片相册
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary" className="w-full sm:w-auto">
          创建相册
        </Button>
      </div>

      {/* Albums List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-900 rounded-3xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6"
            >
              <Skeleton className="h-6 w-2/3 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg mt-3" />
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
          description={<>暂时无法获取相册信息，请稍后重试</>}
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M6 20.25h12a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          }
          tone="neutral"
          size="md"
          action={
            <Button onClick={loadData} variant="primary">
              重新加载
            </Button>
          }
        />
      ) : albums.length === 0 ? (
        <EmptyState
          title="暂无相册"
          description={<>创建相册来组织你的照片</>}
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5m-16.5 4.5h16.5m-16.5 4.5h10.5" />
            </svg>
          }
          tone="accent"
          size="md"
          action={
            <Button onClick={() => setShowCreateModal(true)} variant="primary">
              创建第一个相册
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6 hover:ring-[color:var(--ds-accent-20)] hover:shadow-xl transition-all duration-300"
            >
              <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">
                {album.title}
              </h3>
              {album.summary && (
                <p className="text-sm text-[color:var(--ds-muted)] mb-3 line-clamp-2 leading-relaxed">
                  {album.summary}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-[color:var(--ds-muted-soft)] mb-4 flex-wrap">
                {album.series && (
                  <span className="px-3 py-1.5 bg-[color:var(--ds-accent-10)] text-[color:var(--ds-accent)] rounded-full ring-1 ring-[color:var(--ds-accent-20)] font-medium">
                    {album.series.title}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[color:var(--ds-luxury)]" />
                  {album.photoCount} 张照片
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => startEdit(album)}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  编辑
                </Button>
                <Button
                  onClick={() => handleDelete(album.id)}
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

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAlbum) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 max-w-lg w-full p-8">
            <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight">
              {editingAlbum ? '编辑相册' : '创建相册'}
            </h2>

            <div className="space-y-5">
              <Input
                label="相册标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入相册标题"
                required
              />

              <div>
                <label className="block text-sm font-medium tracking-wide text-[color:var(--ds-muted)] mb-2">
                  简介（可选）
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="输入相册简介"
                  rows={3}
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-[color:var(--ds-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
                />
              </div>

              <div>
                <label htmlFor="album-series" className="block text-sm font-medium tracking-wide text-[color:var(--ds-muted)] mb-2">
                  所属系列（可选）
                </label>
                <select
                  id="album-series"
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
                >
                  <option value="">无</option>
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                onClick={editingAlbum ? handleUpdate : handleCreate}
                variant="primary"
                className="flex-1"
                disabled={!title.trim()}
              >
                {editingAlbum ? '保存' : '创建'}
              </Button>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAlbum(null);
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
