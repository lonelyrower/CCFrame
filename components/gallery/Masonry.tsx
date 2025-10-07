'use client';

import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '@/lib/image/utils';

interface Photo {
  id: string;
  title: string | null;
  fileKey: string;
  width: number | null;
  height: number | null;
  isPublic: boolean;
  tags: string[];
}

interface MasonryProps {
  photos: Photo[];
  onPhotoClick?: (photo: Photo) => void;
}

export function Masonry({ photos, onPhotoClick }: MasonryProps) {
  const [columns, setColumns] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(1);
      } else if (width < 1024) {
        setColumns(2);
      } else if (width < 1536) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Distribute photos into columns
  const distributePhotos = () => {
    const cols: Photo[][] = Array.from({ length: columns }, () => []);
    const colHeights = Array(columns).fill(0);

    photos.forEach((photo) => {
      // Find shortest column
      const minHeightIndex = colHeights.indexOf(Math.min(...colHeights));

      // Add photo to that column
      cols[minHeightIndex].push(photo);

      // Update column height (estimate based on aspect ratio)
      const aspectRatio = photo.width && photo.height ? photo.height / photo.width : 1;
      colHeights[minHeightIndex] += aspectRatio * 300; // 300px base width
    });

    return cols;
  };

  const photoColumns = distributePhotos();

  return (
    <div
      ref={containerRef}
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {photoColumns.map((column, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-4">
          {column.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onClick={onPhotoClick} />
          ))}
        </div>
      ))}
    </div>
  );
}

function PhotoCard({
  photo,
  onClick,
}: {
  photo: Photo;
  onClick?: (photo: Photo) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const aspectRatio = photo.width && photo.height ? photo.height / photo.width : 1;

  return (
    <div
      ref={imgRef}
      className="group relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 cursor-pointer ring-1 ring-inset ring-black/10 dark:ring-white/10 transform-gpu will-change-transform transition duration-200 ease-out hover:scale-[1.01] hover:shadow-md hover:shadow-black/20 dark:hover:shadow-black/40"
      style={{ aspectRatio: `1 / ${aspectRatio}` }}
      onClick={() => onClick?.(photo)}
    >
      {isVisible && (
        <>
          <img
            src={getImageUrl(photo.fileKey, photo.isPublic, { width: 600, quality: 85 })}
            alt={photo.title || 'Photo'}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {photo.title && (
                <p className="text-white text-sm font-medium mb-2">{photo.title}</p>
              )}
              {photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {photo.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-white/20 backdrop-blur rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Loading skeleton */}
      {!isLoaded && isVisible && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
      )}
    </div>
  );
}
