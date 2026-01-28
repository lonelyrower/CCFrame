'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ImageViewer } from '@/components/media/ImageViewer';
import {
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
} from '@/components/ui/Icons';

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

// Haptic feedback helper for PWA
const triggerHaptic = (duration: number = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

export function Lightbox({ photo, onClose, onPrevious, onNext }: LightboxProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 60;
  const SWIPE_VELOCITY_THRESHOLD = 0.3;

  // Handle swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isAnimating || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    // Only handle horizontal swipes (ratio > 2:1)
    if (Math.abs(deltaX) > Math.abs(deltaY) * 2 && Math.abs(deltaX) > 10) {
      // Apply resistance at edges
      const canSwipeLeft = onPrevious && deltaX > 0;
      const canSwipeRight = onNext && deltaX < 0;

      if (canSwipeLeft || canSwipeRight) {
        setSwipeOffset(deltaX * 0.6);
      } else {
        setSwipeOffset(deltaX * 0.1);
      }
    }
  }, [isAnimating, onPrevious, onNext]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;

    const elapsed = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(swipeOffset) / elapsed;
    const shouldNavigate = Math.abs(swipeOffset) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;

    if (shouldNavigate) {
      setIsAnimating(true);
      // Haptic feedback on successful swipe
      triggerHaptic(15);
      
      if (swipeOffset > 0 && onPrevious) {
        setSwipeOffset(window.innerWidth);
        setTimeout(() => {
          onPrevious();
          setSwipeOffset(0);
          setIsAnimating(false);
        }, 250);
      } else if (swipeOffset < 0 && onNext) {
        setSwipeOffset(-window.innerWidth);
        setTimeout(() => {
          onNext();
          setSwipeOffset(0);
          setIsAnimating(false);
        }, 250);
      } else {
        setSwipeOffset(0);
        setIsAnimating(false);
      }
    } else {
      setSwipeOffset(0);
    }

    touchStartRef.current = null;
  }, [swipeOffset, onPrevious, onNext]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && onPrevious) onPrevious();
      if (event.key === 'ArrowRight' && onNext) onNext();
      if (event.key === 'i' || event.key === 'I') setShowInfo((v: boolean) => !v);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, onPrevious, onNext]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black animate-overlay-in-200">
      {/* Vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 rounded-full bg-black/50 p-3 text-white/90 transition-all duration-200 ease-out hover:scale-105 hover:bg-black/70 hover:text-white active:scale-95 backdrop-blur-sm ring-1 ring-white/10 md:top-6 md:right-6"
        aria-label="关闭"
      >
        <CloseIcon size={22} />
      </button>

      {/* Navigation buttons - Desktop only */}
      {onPrevious && (
        <button
          onClick={onPrevious}
          className="hidden md:flex absolute left-4 z-20 rounded-full bg-black/50 p-4 text-white/90 transition-all duration-200 ease-out hover:scale-105 hover:bg-black/70 active:scale-95 backdrop-blur-sm ring-1 ring-white/10"
          aria-label="上一张"
        >
          <ChevronLeftIcon size={24} />
        </button>
      )}

      {onNext && (
        <button
          onClick={onNext}
          className="hidden md:flex absolute right-4 z-20 rounded-full bg-black/50 p-4 text-white/90 transition-all duration-200 ease-out hover:scale-105 hover:bg-black/70 active:scale-95 backdrop-blur-sm ring-1 ring-white/10"
          aria-label="下一张"
        >
          <ChevronRightIcon size={24} />
        </button>
      )}

      {/* Main image container with swipe support */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isAnimating ? 'transform 250ms cubic-bezier(0.22, 1, 0.36, 1)' : swipeOffset === 0 ? 'transform 200ms ease-out' : 'none',
        }}
      >
        {/* Image viewer */}
        <div className="relative w-full h-full md:w-[calc(100%-8rem)] md:h-[90vh] md:max-w-7xl">
          <ImageViewer
            fileKey={photo.fileKey}
            isPublic={photo.isPublic}
            alt={photo.title || '照片'}
            className="h-full w-full"
          />
        </div>

        {/* Mobile swipe indicators - enhanced */}
        {swipeOffset !== 0 && (
          <>
            {swipeOffset > 0 && onPrevious && (
              <div 
                className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full backdrop-blur-md text-white transition-all duration-150"
                style={{ 
                  opacity: Math.min(1, Math.abs(swipeOffset) / SWIPE_THRESHOLD),
                  transform: `translateY(-50%) scale(${0.8 + Math.min(0.2, Math.abs(swipeOffset) / SWIPE_THRESHOLD * 0.2)})`,
                  backgroundColor: Math.abs(swipeOffset) >= SWIPE_THRESHOLD ? 'rgba(var(--ds-accent-rgb), 0.9)' : 'rgba(255,255,255,0.2)'
                }}
              >
                <ChevronLeftIcon size={22} />
              </div>
            )}
            {swipeOffset < 0 && onNext && (
              <div 
                className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full backdrop-blur-md text-white transition-all duration-150"
                style={{ 
                  opacity: Math.min(1, Math.abs(swipeOffset) / SWIPE_THRESHOLD),
                  transform: `translateY(-50%) scale(${0.8 + Math.min(0.2, Math.abs(swipeOffset) / SWIPE_THRESHOLD * 0.2)})`,
                  backgroundColor: Math.abs(swipeOffset) >= SWIPE_THRESHOLD ? 'rgba(var(--ds-accent-rgb), 0.9)' : 'rgba(255,255,255,0.2)'
                }}
              >
                <ChevronRightIcon size={22} />
              </div>
            )}
          </>
        )}
        
        {/* Mobile navigation hint */}
        <div className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white/60 text-xs pointer-events-none">
          <ChevronLeftIcon size={14} />
          <span>滑动切换</span>
          <ChevronRightIcon size={14} />
        </div>
      </div>

      {/* Info panel - slides up from bottom */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-300 ease-out ${
          showInfo ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-4xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="rounded-2xl bg-black/70 p-5 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                {photo.title && (
                  <h2 className="mb-2 text-lg font-serif font-semibold leading-tight tracking-tight md:text-xl">
                    {photo.title}
                  </h2>
                )}
                {photo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {photo.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium tracking-wide ring-1 ring-white/15"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 mt-3 md:mt-0">
                <div>
                  <div className="mb-0.5 text-[10px] uppercase tracking-wider text-white/50">可见性</div>
                  <div className="font-medium text-white/90">{photo.isPublic ? '公开' : '私密'}</div>
                </div>
                <div>
                  <div className="mb-0.5 text-[10px] uppercase tracking-wider text-white/50">分辨率</div>
                  <div className="font-medium text-white/90">
                    {photo.width && photo.height ? `${photo.width} × ${photo.height}` : '未知'}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="mb-0.5 text-[10px] uppercase tracking-wider text-white/50">比例</div>
                  <div className="font-medium text-white/90">
                    {photo.width && photo.height && photo.height !== 0
                      ? `${(photo.width / photo.height).toFixed(2)}:1`
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info toggle button - enhanced touch target */}
      <button
        onClick={() => setShowInfo((value: boolean) => !value)}
        className={`absolute z-30 rounded-full bg-black/50 p-3.5 text-white/80 transition-all duration-200 ease-out hover:scale-105 hover:bg-black/70 hover:text-white active:scale-95 backdrop-blur-sm ring-1 ring-white/10 touch-manipulation ${
          showInfo 
            ? 'bottom-4 right-4 md:bottom-6 md:right-6' 
            : 'bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6'
        }`}
        aria-label="切换信息面板"
      >
        <InfoIcon size={20} filled={showInfo} />
      </button>

      {/* Background click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-label="关闭灯箱" />
    </div>
  );
}
