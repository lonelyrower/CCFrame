'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
    try {
      const [albumsRes, seriesRes] = await Promise.all([
        fetch('/api/albums'),
        fetch('/api/series'),
      ]);
      const albumsData = await albumsRes.json();
      const seriesData = await seriesRes.json();
      setAlbums(albumsData.albums);
      setSeries(seriesData.series);
    } catch (error) {
      console.error('Error loading data:', error);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-block mb-3">
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
              Management
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">
            相册管理
          </h1>
          <p className="text-stone-600 dark:text-stone-400 font-light">
            创建和管理照片相册
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary">
          创建相册
        </Button>
      </div>

      {/* Albums List */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[#e63946] dark:border-t-[#ff6b7a]" />
            <span className="text-sm uppercase tracking-widest text-stone-600 dark:text-stone-400 font-light">
              Loading
            </span>
          </div>
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-stone-600 dark:text-stone-400 font-light mb-6">暂无相册</p>
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            创建第一个相册
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-800/50 p-6 hover:ring-[#e63946]/20 dark:hover:ring-[#ff6b7a]/20 hover:shadow-xl transition-all duration-300"
            >
              <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-2 tracking-tight">
                {album.title}
              </h3>
              {album.summary && (
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-3 line-clamp-2 leading-relaxed">
                  {album.summary}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-4 flex-wrap">
                {album.series && (
                  <span className="px-3 py-1.5 bg-[#e63946]/10 dark:bg-[#ff6b7a]/10 text-[#e63946] dark:text-[#ff6b7a] rounded-full ring-1 ring-[#e63946]/20 dark:ring-[#ff6b7a]/20 font-medium">
                    {album.series.title}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#d4af37]" />
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
                  className="text-[#e63946] dark:text-[#ff6b7a] hover:bg-[#e63946]/10 dark:hover:bg-[#ff6b7a]/10"
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
                <label className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-2">
                  简介（可选）
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="输入相册简介"
                  rows={3}
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 dark:focus:ring-[#ff6b7a]/20 focus:border-[#e63946] dark:focus:border-[#ff6b7a] transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-2">
                  所属系列（可选）
                </label>
                <select
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 dark:focus:ring-[#ff6b7a]/20 focus:border-[#e63946] dark:focus:border-[#ff6b7a] transition-all duration-300"
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
