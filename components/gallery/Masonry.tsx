'use client';

import { useMemo, useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { ProgressiveImage } from '@/components/media/ProgressiveImage';

// Haptic feedback for photo selection
const triggerHaptic = (duration = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

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
  const photoColumns = useMemo(() => {
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
  }, [columns, photos]);

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
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    triggerHaptic(12);
    onClick?.(photo);
  }, [onClick, photo]);

  // View Transition name for seamless hero animations
  const viewTransitionName = `photo-${photo.id}`;

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
  const hasMeta = Boolean(photo.title) || photo.tags.length > 0;

  return (
    <div
      ref={imgRef}
      className="group relative overflow-hidden rounded-2xl bg-stone-200 dark:bg-neutral-800 cursor-pointer ring-1 ring-inset ring-stone-300/30 dark:ring-neutral-700/30 transform-gpu will-change-transform transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl hover:shadow-black/25 dark:hover:shadow-black/50 hover:ring-[color:var(--ds-accent-20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ds-accent-60)] focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 dark:focus-visible:ring-offset-neutral-950 touch-manipulation select-none"
      style={{
        aspectRatio: `1 / ${aspectRatio}`,
        viewTransitionName,
        contentVisibility: 'auto',
        containIntrinsicSize: `auto 300px`,
      }}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={photo.title ? `Open photo: ${photo.title}` : 'Open photo'}
    >
      {isVisible && (
        <>
          <ProgressiveImage
            fileKey={photo.fileKey}
            isPublic={photo.isPublic}
            alt={photo.title || 'Photo'}
            className="absolute inset-0"
            imgClassName="transform-gpu transition-transform duration-500 group-hover:scale-105 group-active:scale-100"
            highResOptions={{ width: 900, quality: 88 }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
            onHighResLoad={() => startTransition(() => setIsLoaded(true))}
            onHighResError={() => startTransition(() => setIsLoaded(true))}
            viewTransition
            viewTransitionName={viewTransitionName}
          />

          {/* Sophisticated overlay on hover - Desktop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 md:group-hover:opacity-100 transition-all duration-300 ease-out">
            <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-4 md:group-hover:translate-y-0 transition-transform duration-300 ease-out">
              {photo.title && (
                <p className="text-white text-base font-serif font-semibold mb-3 tracking-tight leading-tight">{photo.title}</p>
              )}
              {photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {photo.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 bg-white/15 dark:bg-white/10 backdrop-blur-sm rounded-full ring-1 ring-white/20 text-white font-medium tracking-wide"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile overlay for metadata - always visible on mobile */}
          {hasMeta && (
            <div className="absolute inset-x-0 bottom-0 md:hidden pointer-events-none">
              <div className="bg-gradient-to-t from-black/60 via-black/20 to-transparent px-3 pb-3 pt-8">
                {photo.title && (
                  <p className="text-white text-sm font-serif font-semibold tracking-tight truncate drop-shadow-sm">
                    {photo.title}
                  </p>
                )}
                {photo.tags.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-white/70 truncate">{photo.tags[0]}</p>
                )}
              </div>
            </div>
          )}

          {/* Accent glow effect - Desktop only */}
          <div className="hidden md:block absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--ds-accent-10)] via-transparent to-[var(--ds-luxury-10)] mix-blend-overlay" />
          </div>
        </>
      )}

      {/* Premium loading skeleton with shimmer */}
      {!isLoaded && isVisible && (
        <div className="absolute inset-0 skeleton" />
      )}
    </div>
  );
}
