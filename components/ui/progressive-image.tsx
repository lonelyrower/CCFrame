"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  blurDataURL?: string
  width?: number
  height?: number
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
  sizes?: string
}

export function ProgressiveImage({
  src,
  alt,
  className,
  placeholder,
  blurDataURL,
  width,
  height,
  priority = false,
  onLoad,
  onError,
  sizes
}: ProgressiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || imageLoaded) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    if (placeholderRef.current) {
      observer.observe(placeholderRef.current)
    }

    return () => observer.disconnect()
  }, [priority, imageLoaded])

  const handleLoad = () => {
    setImageLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Generate simple blur placeholder if none provided
  const defaultBlurDataURL = blurDataURL || `data:image/svg+xml;base64,${btoa(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#gradient)" />
    </svg>
  `)}`

  return (
    <div
      ref={placeholderRef}
      className={cn("relative overflow-hidden", className)}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300 ease-out",
          imageLoaded ? "opacity-0" : "opacity-100"
        )}
        style={{
          backgroundImage: `url(${placeholder || defaultBlurDataURL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px)',
          transform: 'scale(1.1)' // Slightly larger to hide blur edges
        }}
      />

      {/* Loading skeleton */}
      {!imageLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}

      {/* Main image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-400 dark:text-gray-600">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-xs">加载失败</p>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isInView && !imageLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full p-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for generating blur data URLs from images
export function useBlurDataURL(src: string) {
  const [blurDataURL, setBlurDataURL] = useState<string>()

  useEffect(() => {
    if (!src) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = 40
      canvas.height = 30

      ctx?.drawImage(img, 0, 0, 40, 30)

      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.1)
        setBlurDataURL(dataURL)
      } catch (error) {
        // Fallback if canvas toDataURL fails (CORS, etc.)
        console.warn('Failed to generate blur data URL:', error)
      }
    }

    img.src = src
  }, [src])

  return blurDataURL
}

// High-level component for photo gallery usage
export function GalleryImage({
  photoId,
  variant = 'small',
  format = 'webp',
  alt,
  className,
  priority = false,
  ...props
}: {
  photoId: string
  variant?: 'thumb' | 'small' | 'medium' | 'large'
  format?: 'webp' | 'jpeg'
  alt: string
  className?: string
  priority?: boolean
} & Omit<ProgressiveImageProps, 'src' | 'alt'>) {
  const src = `/api/image/${photoId}/${variant}?format=${format}`
  const blurSrc = `/api/image/${photoId}/thumb?format=jpeg` // Small JPEG for blur

  return (
    <ProgressiveImage
      src={src}
      alt={alt}
      placeholder={blurSrc}
      className={className}
      priority={priority}
      {...props}
    />
  )
}