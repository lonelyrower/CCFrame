'use client';

import { KeyboardEvent, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { getImageSrcSet, getImageUrl } from '@/lib/image/utils';

export interface ProgressiveImageProps {
  fileKey: string;
  isPublic?: boolean;
  alt?: string;
  highResOptions?: {
    width?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'json';
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  };
  lowResOptions?: {
    width?: number;
    quality?: number;
  };
  objectFit?: 'cover' | 'contain';
  className?: string;
  imgClassName?: string;
  /** @deprecated Use preload instead (Next.js 16+) */
  priority?: boolean;
  /** Preload the image for LCP optimization (Next.js 16+) */
  preload?: boolean;
  sizes?: string;
  onClick?: () => void;
  onHighResLoad?: () => void;
  onHighResError?: () => void;
  /** Enable View Transitions API for smooth image swaps */
  viewTransition?: boolean;
  /** Unique name for View Transition */
  viewTransitionName?: string;
}

/**
 * Progressive image loader with low-res placeholder and fade-in effect.
 * Falls back gracefully when either low/high resolution fails.
 */
export function ProgressiveImage({
  fileKey,
  isPublic = true,
  alt = '',
  highResOptions,
  lowResOptions,
  objectFit = 'cover',
  className,
  imgClassName,
  priority = false,
  preload,
  sizes,
  onClick,
  onHighResLoad,
  onHighResError,
  viewTransition = false,
  viewTransitionName,
}: ProgressiveImageProps) {
  const [lowResLoaded, setLowResLoaded] = useState(false);
  const [highResLoaded, setHighResLoaded] = useState(false);
  const [highResError, setHighResError] = useState(false);
  const highResRef = useRef<HTMLImageElement>(null);
  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';
  
  // Resolve preload (Next.js 16+) vs deprecated priority
  const shouldPreload = preload ?? priority;

  const containerClassName = useMemo(() => {
    const base = ['relative', 'overflow-hidden', 'h-full', 'w-full'];
    if (className) base.push(className);
    return base.join(' ');
  }, [className]);

  // Memoise URLs to avoid re-computing on re-renders
  const { lowResUrl, highResUrl, highResSrcSet } = useMemo(() => {
    const low = getImageUrl(fileKey, isPublic, {
      width: lowResOptions?.width ?? 48,
      quality: lowResOptions?.quality ?? 30,
      format: 'webp',
    });

    const highQuality = highResOptions?.quality ?? 90;
    const highFormat =
      highResOptions?.format === 'webp' || highResOptions?.format === 'avif'
        ? highResOptions.format
        : 'auto';
    const highFit = highResOptions?.fit;

    const high = getImageUrl(fileKey, isPublic, {
      width: highResOptions?.width,
      quality: highQuality,
      format: highFormat,
      fit: highFit,
    });

    const srcSet = getImageSrcSet(fileKey, isPublic, undefined, {
      quality: highQuality,
      format: highFormat,
      fit: highFit,
    });

    return {
      lowResUrl: low,
      highResUrl: high,
      highResSrcSet: srcSet,
    };
  }, [fileKey, isPublic, highResOptions, lowResOptions]);

  // Reset state when file changes
  useEffect(() => {
    setLowResLoaded(false);
    setHighResLoaded(false);
    setHighResError(false);
  }, [fileKey]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={containerClassName}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* 骨架屏占位符 */}
      <div 
        className={`absolute inset-0 skeleton transition-opacity duration-500 ${
          lowResLoaded || highResLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden
      />

      {/* Low-res placeholder with LQIP blur */}
      <img
        src={lowResUrl}
        alt=""
        className={`absolute inset-0 h-full w-full ${fitClass} blur-xl scale-105 transition-opacity duration-500 ${
          lowResLoaded && !highResLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLowResLoaded(true)}
        aria-hidden
        loading={shouldPreload ? 'eager' : 'lazy'}
        decoding="async"
      />

      {/* High-res image with modern loading hints */}
      <img
        ref={highResRef}
        src={highResUrl}
        srcSet={highResSrcSet}
        alt={alt}
        className={`relative h-full w-full ${fitClass} transition-opacity duration-500 ${
          highResLoaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName || ''}`}
        style={viewTransition && viewTransitionName ? { viewTransitionName } : undefined}
        onLoad={() => {
          setHighResLoaded(true);
          onHighResLoad?.();
        }}
        onError={() => {
          setHighResError(true);
          onHighResError?.();
        }}
        loading={shouldPreload ? 'eager' : 'lazy'}
        fetchPriority={shouldPreload ? 'high' : 'auto'}
        decoding="async"
        sizes={sizes}
      />

      {/* Fallback when high-res fails */}
      {highResError && (
        <div className="flex h-full w-full items-center justify-center bg-stone-200 text-stone-500 dark:bg-neutral-800 dark:text-neutral-400">
          Image failed to load
        </div>
      )}
    </div>
  );
}
