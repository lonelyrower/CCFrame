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
  isPublic: boolean;
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

      if (!response.ok) {
        console.error('Failed to fetch album:', response.status);
        return;
      }

      const data = await response.json();
      setAlbum(data.album || null);
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
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb - Fashion Style */}
        <div className="mb-8">
          {album?.series ? (
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <Link
                href="/series"
                className="text-[#e63946] dark:text-[#ff6b7a] hover:underline"
              >
                系列
              </Link>
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link
                href={`/series/${album.series.id}`}
                className="text-[#e63946] dark:text-[#ff6b7a] hover:underline"
              >
                {album.series.title}
              </Link>
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-stone-600 dark:text-stone-400">
                {album.title}
              </span>
            </div>
          ) : (
            <Link
              href="/photos"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#e63946] dark:text-[#ff6b7a] hover:gap-3 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              返回照片
            </Link>
          )}
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
        ) : !album ? (
          <div className="text-center py-20">
            <p className="text-xl text-stone-600 dark:text-stone-400 font-light">相册不存在</p>
          </div>
        ) : (
          <>
            {/* Header - Editorial Style */}
            <div className="mb-16">
              <div className="inline-block mb-4">
                <span className="text-xs md:text-sm uppercase tracking-[0.2em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
                  Album
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-6 tracking-tight leading-tight">
                {album.title}
              </h1>
              {album.summary && (
                <p className="text-xl md:text-2xl text-stone-600 dark:text-stone-400 max-w-4xl mb-6 font-light leading-relaxed">
                  {album.summary}
                </p>
              )}
              <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e63946] dark:bg-[#ff6b7a]" />
                <p className="text-base text-stone-500 dark:text-stone-400">
                  {album.photos.length} 张作品
                </p>
              </div>
            </div>

            {/* Photos */}
            {album.photos.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-stone-600 dark:text-stone-400 font-light">相册暂无作品</p>
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
