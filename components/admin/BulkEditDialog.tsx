'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface Album {
  id: string;
  title: string;
}

interface BulkEditDialogProps {
  selectedCount: number;
  onClose: () => void;
  onSave: (data: { tags?: string[]; albumId?: string | null }) => Promise<void>;
}

export function BulkEditDialog({ selectedCount, onClose, onSave }: BulkEditDialogProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updateTags, setUpdateTags] = useState(false);
  const [updateAlbum, setUpdateAlbum] = useState(false);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const response = await fetch('/api/albums');
      if (response.ok) {
        const data = await response.json();
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updateData: { tags?: string[]; albumId?: string | null } = {};

      if (updateTags) {
        updateData.tags = tags;
      }

      if (updateAlbum) {
        updateData.albumId = selectedAlbumId || null;
      }

      await onSave(updateData);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl ring-1 ring-stone-200/50 dark:ring-neutral-800/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-8 border-b border-stone-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tight">
              批量编辑 <span className="text-[color:var(--ds-accent)]">{selectedCount}</span> 张照片
            </h2>
            <button
              onClick={onClose}
              className="text-[color:var(--ds-muted-soft)] hover:text-[color:var(--ds-accent)] transition-colors p-2 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Album Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="update-album"
                checked={updateAlbum}
                onChange={(e) => setUpdateAlbum(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-stone-300 dark:border-neutral-700 text-[color:var(--ds-accent)] focus:ring-[color:var(--ds-accent-20)] focus:ring-2"
              />
              <label htmlFor="update-album" className="text-sm font-medium tracking-wide text-stone-900 dark:text-stone-50 cursor-pointer">
                更新相册
              </label>
            </div>
            {updateAlbum && (
              <select
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
              >
                <option value="">不选择相册</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="update-tags"
                checked={updateTags}
                onChange={(e) => setUpdateTags(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-stone-300 dark:border-neutral-700 text-[color:var(--ds-accent)] focus:ring-[color:var(--ds-accent-20)] focus:ring-2"
              />
              <label htmlFor="update-tags" className="text-sm font-medium tracking-wide text-stone-900 dark:text-stone-50 cursor-pointer">
                更新标签
              </label>
            </div>
            {updateTags && (
              <>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入标签后按回车"
                  className="w-full px-5 py-3 rounded-xl border-2 border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 placeholder-[color:var(--ds-muted-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-accent-20)] focus:border-[color:var(--ds-accent)] transition-all duration-300"
                />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[color:var(--ds-accent-10)] text-[color:var(--ds-accent)] rounded-full text-sm ring-1 ring-[color:var(--ds-accent-20)] font-medium"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:scale-110 transition-transform"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[color:var(--ds-muted-soft)] leading-relaxed">
                  注意：这将替换所选照片的现有标签
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-stone-200 dark:border-neutral-800 flex justify-end gap-3">
          <Button onClick={onClose} variant="secondary" disabled={isLoading}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading || (!updateTags && !updateAlbum)}
          >
            保存更改
          </Button>
        </div>
      </div>
    </div>
  );
}
