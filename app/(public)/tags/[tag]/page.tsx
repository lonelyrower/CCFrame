'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Masonry } from '@/components/gallery/Masonry';
import { Lightbox } from '@/components/gallery/Lightbox';
import Link from 'next/link';

interface Photo {
  id: string;
  title: string | null;
  fileKey: string;
  width: number | null;
  height: number | null;
  isPublic: boolean;
  tags: string[];
}

export default function TagDetailPage() {
  const params = useParams();
  const tagName = decodeURIComponent(params.tag as string);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagName]);

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/photos?isPublic=true&tag=${encodeURIComponent(tagName)}&limit=100`
      );

      if (!response.ok) {
        console.error('Failed to fetch photos:', response.status);
        return;
      }

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    const index = photos.findIndex((p) => p.id === photo.id);
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      const prevIndex = selectedIndex - 1;
      setSelectedPhoto(photos[prevIndex]);
      setSelectedIndex(prevIndex);
    }
  };

  const handleNext = () => {
    if (selectedIndex < photos.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedPhoto(photos[nextIndex]);
      setSelectedIndex(nextIndex);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/tags"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#e63946] dark:text-[#ff6b7a] hover:gap-3 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回标签列表
          </Link>
        </div>

        {/* Header - Fashion Style */}
        <div className="mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs md:text-sm uppercase tracking-[0.2em] font-medium text-[#e63946] dark:text-[#ff6b7a]">
              Tag
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-tight">
            #{tagName}
          </h1>
          <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 font-light">
            {photos.length} 张作品
          </p>
        </div>

        {/* Photos */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 dark:border-neutral-700 border-t-[#e63946] dark:border-t-[#ff6b7a]" />
              <span className="text-sm uppercase tracking-widest text-stone-600 dark:text-stone-400 font-light">
                Loading
              </span>
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-stone-600 dark:text-stone-400 font-light">该标签下暂无作品</p>
          </div>
        ) : (
          <Masonry photos={photos} onPhotoClick={handlePhotoClick} />
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
          onNext={selectedIndex < photos.length - 1 ? handleNext : undefined}
        />
      )}
    </div>
  );
}
