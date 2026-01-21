'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

const THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ onRefresh, children, disabled }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const canPull = useCallback(() => {
    if (disabled || isRefreshing) return false;
    return window.scrollY <= 0;
  }, [disabled, isRefreshing]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!canPull()) return;
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  }, [canPull]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || !canPull()) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0) {
      // Apply resistance
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(distance);

      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, startY, canPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(60); // Keep indicator visible

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 180;

  return (
    <div ref={containerRef} className="relative min-h-full">
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-10 transition-opacity duration-200"
        style={{
          top: -60,
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-neutral-800 shadow-lg ${
          isRefreshing ? 'animate-spin' : ''
        }`}>
          {isRefreshing ? (
            <svg className="w-5 h-5 text-[color:var(--ds-accent)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-[color:var(--ds-accent)] transition-transform duration-150"
              style={{ transform: `rotate(${rotation}deg)` }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : 'translateY(0)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
