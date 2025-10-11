'use client';

import { useEffect, useState } from 'react';
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

interface LightboxProps {
  photo: Photo;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function Lightbox({ photo, onClose, onPrevious, onNext }: LightboxProps) {
  const [showInfo, setShowInfo] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrevious) onPrevious();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, onPrevious, onNext]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center animate-overlay-in-200">
      {/* Elegant vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 110% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Minimal close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/15 text-white hover:text-white/90 backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 active:scale-95 z-10 ring-1 ring-white/10"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Previous button - Refined */}
      {onPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-6 p-4 rounded-full bg-white/10 hover:bg-white/15 text-white backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 active:scale-95 ring-1 ring-white/10"
          aria-label="Previous"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Next button - Refined */}
      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-6 p-4 rounded-full bg-white/10 hover:bg-white/15 text-white backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 active:scale-95 ring-1 ring-white/10"
          aria-label="Next"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Image */}
      <div className="relative max-w-7xl max-h-[90vh] mx-auto px-4 animate-zoom-in-200">
        <img
          src={getImageUrl(photo.fileKey, photo.isPublic, { width: 1920, quality: 95 })}
          alt={photo.title || 'Photo'}
          className="max-w-full max-h-[80vh] object-contain mx-auto"
        />

        {/* Premium info panel (bottom overlay) */}
        {showInfo && (
          <div className="absolute left-0 right-0 -bottom-2 px-4">
            <div className="mx-auto max-w-5xl rounded-3xl bg-black/40 backdrop-blur-2xl ring-1 ring-white/10 text-white p-6 md:p-7 transition-all duration-300 ease-out shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {photo.title && (
                    <h2 className="text-xl md:text-2xl font-serif font-bold tracking-tight mb-3 leading-tight">
                      {photo.title}
                    </h2>
                  )}
                  {photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2.5">
                      {photo.tags.slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-3 py-1.5 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm font-medium tracking-wide"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 shrink-0 text-sm">
                  <div>
                    <div className="text-white/60 text-xs uppercase tracking-wider mb-1">可见性</div>
                    <div className="font-semibold">{photo.isPublic ? '公开' : '私密'}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs uppercase tracking-wider mb-1">分辨率</div>
                    <div className="font-semibold">
                      {photo.width && photo.height ? `${photo.width} × ${photo.height}` : '未知'}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-white/60 text-xs uppercase tracking-wider mb-1">画幅</div>
                    <div className="font-semibold">
                      {photo.width && photo.height && photo.height !== 0
                        ? `${(photo.width / photo.height).toFixed(2)}:1`
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info toggle - Minimal design */}
      <button
        onClick={() => setShowInfo((v) => !v)}
        className="absolute bottom-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/15 text-white/90 hover:text-white backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 active:scale-95 ring-1 ring-white/10"
        aria-label="Toggle info"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
      </button>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close lightbox"
      />
    </div>
  );
}
