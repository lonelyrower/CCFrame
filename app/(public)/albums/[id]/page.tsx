'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Masonry } from '@/components/gallery/Masonry';
import { Lightbox } from '@/components/gallery/Lightbox';

interface Photo {
  id: string;
  title: string | null;
  fileKey: string;
  width: number | null;
  height: number | null;
  tags: string[];
}

interface Album {
  id: string;
  title: string;
  summary: string | null;
  series: {
    id: string;
    title: string;
  } | null;
  photos: Photo[];
}

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    loadAlbum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  const loadAlbum = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/albums/${albumId}`);
      const data = await response.json();
      setAlbum(data.album);
    } catch (error) {
      console.error('Error loading album:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    if (!album) return;
    const index = album.photos.findIndex((p) => p.id === photo.id);
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const handlePrevious = () => {
    if (!album || selectedIndex <= 0) return;
    const prevIndex = selectedIndex - 1;
    setSelectedPhoto(album.photos[prevIndex]);
    setSelectedIndex(prevIndex);
  };

  const handleNext = () => {
    if (!album || selectedIndex >= album.photos.length - 1) return;
    const nextIndex = selectedIndex + 1;
    setSelectedPhoto(album.photos[nextIndex]);
    setSelectedIndex(nextIndex);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          {album?.series ? (
            <>
              <Link
                href="/series"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                系列
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <Link
                href={`/series/${album.series.id}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {album.series.title}
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {album.title}
              </span>
            </>
          ) : (
            <Link
              href="/photos"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← 返回照片
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
          </div>
        ) : !album ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">相册不存在</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-4">
                {album.title}
              </h1>
              {album.summary && (
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mb-4">
                  {album.summary}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {album.photos.length} 张照片
              </p>
            </div>

            {/* Photos */}
            {album.photos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">相册暂无照片</p>
              </div>
            ) : (
              <Masonry photos={album.photos} onPhotoClick={handlePhotoClick} />
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <Lightbox
          photo={selectedPhoto}
          onClose={() => {
            setSelectedPhoto(null);
            setSelectedIndex(-1);
          }}
          onPrevious={selectedIndex > 0 ? handlePrevious : undefined}
          onNext={
            album && selectedIndex < album.photos.length - 1 ? handleNext : undefined
          }
        />
      )}
    </div>
  );
}
