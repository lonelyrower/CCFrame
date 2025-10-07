'use client';

import { useEffect } from 'react';
import { cfImage } from '@/lib/cf-image';

interface Photo {
  id: string;
  title: string | null;
  fileKey: string;
  width: number | null;
  height: number | null;
  tags: string[];
}

interface LightboxProps {
  photo: Photo;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function Lightbox({ photo, onClose, onPrevious, onNext }: LightboxProps) {
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
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
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
          className="absolute left-4 text-white hover:text-gray-300 transition-colors"
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
          className="absolute right-4 text-white hover:text-gray-300 transition-colors"
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
      <div className="max-w-7xl max-h-[90vh] mx-auto px-4">
        <img
          src={cfImage(`/${photo.fileKey}`, { width: 1920, quality: 95 })}
          alt={photo.title || 'Photo'}
          className="max-w-full max-h-[80vh] object-contain mx-auto"
        />

        {/* Info */}
        <div className="mt-4 text-center">
          {photo.title && (
            <h2 className="text-xl font-medium text-white mb-2">{photo.title}</h2>
          )}
          {photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {photo.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-sm px-3 py-1 bg-white/10 backdrop-blur rounded-full text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close lightbox"
      />
    </div>
  );
}
