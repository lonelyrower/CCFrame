'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

// Haptic feedback for pull-to-refresh states
const triggerHaptic = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

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
      
      // Haptic feedback when crossing threshold
      if (pullDistance < THRESHOLD && distance >= THRESHOLD) {
        triggerHaptic(15);
      }
      
      setPullDistance(distance);

      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, startY, canPull, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= THRESHOLD) {
      // Double haptic feedback for refresh confirmation
      triggerHaptic([10, 50, 10]);
      setIsRefreshing(true);
      setPullDistance(60); // Keep indicator visible

      try {
        await onRefresh();
        // Success haptic
        triggerHaptic(8);
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

  const readyToRefresh = pullDistance >= THRESHOLD;

  return (
    <div ref={containerRef} className="relative min-h-full">
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-20"
        style={{
          top: -60,
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance > 10 ? Math.min(1, pullDistance / 40) : 0,
          transition: isPulling ? 'none' : 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
          readyToRefresh || isRefreshing
            ? 'bg-[color:var(--ds-accent)] shadow-lg shadow-[var(--ds-accent-30)]'
            : 'bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-stone-200/50 dark:ring-neutral-700/50'
        }`}>
          {isRefreshing ? (
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border-2 border-white/30" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
            </div>
          ) : (
            <svg
              className={`w-5 h-5 transition-all duration-300 ${
                readyToRefresh ? 'text-white scale-110' : 'text-[color:var(--ds-accent)]'
              }`}
              style={{ transform: `rotate(${rotation}deg)` }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </div>
        
        {/* 提示文字 */}
        <div 
          className={`absolute top-full mt-2 text-xs font-medium tracking-wide transition-all duration-300 ${
            readyToRefresh 
              ? 'text-[color:var(--ds-accent)] opacity-100' 
              : 'text-[color:var(--ds-muted-soft)] opacity-70'
          }`}
        >
          {isRefreshing ? '刷新中...' : readyToRefresh ? '松开刷新' : '下拉刷新'}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
