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
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-overlay-in-200">
      {/* Soft vignette to avoid harsh pure black */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 75%, rgba(0,0,0,0.65) 100%)',
        }}
      />
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 transition-transform duration-200 ease-out hover:scale-110 active:scale-95"
        aria-label="Close"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Previous button */}
      {onPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-4 text-white hover:text-gray-300 transition-colors transition-transform duration-200 ease-out hover:scale-110 active:scale-95"
          aria-label="Previous"
        >
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Next button */}
      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 text-white hover:text-gray-300 transition-colors transition-transform duration-200 ease-out hover:scale-110 active:scale-95"
          aria-label="Next"
        >
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
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

        {/* Info panel (bottom overlay) */}
        {showInfo && (
          <div className="absolute left-0 right-0 -bottom-2 px-4">
            <div className="mx-auto max-w-5xl rounded-2xl bg-white/6 backdrop-blur-md ring-1 ring-white/15 text-white p-4 md:p-5 transition-all duration-200 ease-out">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0">
                  {photo.title && (
                    <h2 className="text-lg md:text-xl font-serif font-semibold tracking-tight truncate">
                      {photo.title}
                    </h2>
                  )}
                  {photo.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {photo.tags.slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-1 rounded-full bg-white/10 ring-1 ring-white/15"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 shrink-0 text-sm">
                  <div>
                    <div className="text-white/70">可见性</div>
                    <div className="font-medium">{photo.isPublic ? '公开' : '私密'}</div>
                  </div>
                  <div>
                    <div className="text-white/70">分辨率</div>
                    <div className="font-medium">
                      {photo.width && photo.height ? `${photo.width} × ${photo.height}` : '未知'}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-white/70">画幅</div>
                    <div className="font-medium">
                      {photo.width && photo.height && photo.height !== 0
                        ? `${(photo.width / photo.height).toFixed(2)}:1`
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-white/70">
                EXIF：暂不可用（后台解析后可显示相机、镜头、快门、光圈等）
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info toggle */}
      <button
        onClick={() => setShowInfo((v) => !v)}
        className="absolute bottom-6 right-6 text-white/90 hover:text-white transition-colors transition-transform duration-200 ease-out hover:scale-110 active:scale-95"
        aria-label="Toggle info"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
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
