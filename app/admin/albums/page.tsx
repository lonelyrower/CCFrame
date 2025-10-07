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
          <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100">
            相册管理
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            创建和管理照片相册
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary">
          创建相册
        </Button>
      </div>

      {/* Albums List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">暂无相册</p>
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            创建第一个相册
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {album.title}
              </h3>
              {album.summary && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {album.summary}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                {album.series && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                    {album.series.title}
                  </span>
                )}
                <span>{album.photoCount} 张照片</span>
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
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {editingAlbum ? '编辑相册' : '创建相册'}
            </h2>

            <div className="space-y-4">
              <Input
                label="相册标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入相册标题"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  简介（可选）
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="输入相册简介"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  所属系列（可选）
                </label>
                <select
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="flex gap-3 mt-6">
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
