'use client';

import { useEffect, useState } from 'react';
import { WebGLImageViewer } from '@/components/media/WebGLImageViewer';

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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && onPrevious) onPrevious();
      if (event.key === 'ArrowRight' && onNext) onNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, onPrevious, onNext]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 animate-overlay-in-200">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 110% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 rounded-full bg-white/10 p-3 text-white transition-all duration-300 ease-out hover:scale-110 hover:bg-white/15 hover:text-white/90 active:scale-95 backdrop-blur-sm ring-1 ring-white/10"
        aria-label="关闭"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {onPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-6 rounded-full bg-white/10 p-4 text-white transition-all duration-300 ease-out hover:scale-110 hover:bg-white/15 active:scale-95 backdrop-blur-sm ring-1 ring-white/10"
          aria-label="上一张"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-6 rounded-full bg-white/10 p-4 text-white transition-all duration-300 ease-out hover:scale-110 hover:bg-white/15 active:scale-95 backdrop-blur-sm ring-1 ring-white/10"
          aria-label="下一张"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 animate-zoom-in-200">
        <div className="relative mx-auto h-[60vh] w-full min-h-[320px] overflow-hidden rounded-[1.8rem] md:h-[72vh]">
          <WebGLImageViewer
            fileKey={photo.fileKey}
            isPublic={photo.isPublic}
            alt={photo.title || 'Photo'}
            className="h-full"
          />
        </div>

        {showInfo && (
          <div className="pointer-events-none relative -mt-6 w-full px-4 md:-mt-8">
            <div className="pointer-events-auto mx-auto max-w-5xl rounded-3xl bg-black/40 p-6 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl transition-all duration-300 ease-out md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  {photo.title && (
                    <h2 className="mb-3 text-xl font-serif font-bold leading-tight tracking-tight md:text-2xl">
                      {photo.title}
                    </h2>
                  )}
                  {photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2.5">
                      {photo.tags.slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide ring-1 ring-white/20 backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wider text-white/60">可见性</div>
                    <div className="font-semibold">{photo.isPublic ? '公开' : '私密'}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wider text-white/60">分辨率</div>
                    <div className="font-semibold">
                      {photo.width && photo.height ? `${photo.width} × ${photo.height}` : '未知'}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="mb-1 text-xs uppercase tracking-wider text-white/60">比例</div>
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

      <button
        onClick={() => setShowInfo((value) => !value)}
        className="absolute bottom-6 right-6 rounded-full bg-white/10 p-3 text-white/90 transition-all duration-300 ease-out hover:scale-110 hover:bg-white/15 hover:text-white active:scale-95 backdrop-blur-sm ring-1 ring-white/10"
        aria-label="切换信息面板"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
      </button>

      <div className="absolute inset-0 -z-10" onClick={onClose} aria-label="关闭灯箱" />
    </div>
  );
}
