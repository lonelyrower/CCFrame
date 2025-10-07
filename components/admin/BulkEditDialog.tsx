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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Bulk Edit {selectedCount} Photos
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Album Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="update-album"
                checked={updateAlbum}
                onChange={(e) => setUpdateAlbum(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="update-album" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Update Album
              </label>
            </div>
            {updateAlbum && (
              <select
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">No Album</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="update-tags"
                checked={updateTags}
                onChange={(e) => setUpdateTags(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="update-tags" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Update Tags
              </label>
            </div>
            {updateTags && (
              <>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type tag and press Enter"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Note: This will replace existing tags on selected photos
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <Button onClick={onClose} variant="ghost" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading || (!updateTags && !updateAlbum)}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
