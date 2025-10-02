"use client"

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete' | 'onError'> {
  fallbackSrc?: string
  showSkeleton?: boolean
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto'
}

/**
 * 优化的图片组件
 * - 自动懒加载
 * - 错误处理和 fallback
 * - 加载状态显示
 * - 性能优化
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/fallback.jpg',
  showSkeleton = true,
  aspectRatio = 'auto',
  className,
  fill,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  const aspectClasses = {
    square: 'aspect-square',
    landscape: 'aspect-[4/3]',
    portrait: 'aspect-[3/4]',
    auto: ''
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
    }
  }

  return (
    <div className={cn('relative overflow-hidden', !fill && aspectClasses[aspectRatio])}>
      {/* 加载状态骨架屏 */}
      {isLoading && showSkeleton && (
        <Skeleton 
          className={cn(
            'absolute inset-0 z-10',
            fill ? 'h-full w-full' : 'h-full'
          )} 
        />
      )}

      {/* 图片 */}
      <Image
        src={currentSrc}
        alt={alt}
        fill={fill}
        className={cn(
          'transition-opacity duration-500',
          isLoading ? 'opacity-0' : 'opacity-100',
          hasError && 'grayscale',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...props}
      />

      {/* 错误提示（可选） */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-panel/50 backdrop-blur-sm">
          <div className="text-center text-text-muted">
            <svg 
              className="mx-auto h-12 w-12 mb-2 opacity-30" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="text-xs">图片加载失败</p>
          </div>
        </div>
      )}
    </div>
  )
}
