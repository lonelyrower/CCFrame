'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getImageUrl } from '@/lib/image/utils';

interface ImageViewerProps {
  fileKey: string;
  isPublic?: boolean;
  alt?: string;
  className?: string;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
}

interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}

interface TouchState {
  initialDistance: number;
  initialScale: number;
  initialCenter: { x: number; y: number };
  lastCenter: { x: number; y: number };
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_DELAY = 300;
const ANIMATION_DURATION = 250;

/**
 * Modern image viewer with smooth gestures:
 * - Pinch to zoom (touch)
 * - Double-tap to zoom in/out
 * - Pan when zoomed
 * - Mouse wheel zoom
 * - Smooth CSS transitions
 */
export function ImageViewer({
  fileKey,
  isPublic = true,
  alt = '',
  className,
  onLoadStart,
  onLoadComplete,
}: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Touch state refs (don't trigger re-renders)
  const touchStateRef = useRef<TouchState | null>(null);
  const lastTapRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });

  // Calculate constrained bounds
  const getBounds = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image || !imageDimensions) return null;

    const containerRect = container.getBoundingClientRect();
    const displayedWidth = imageDimensions.width * transform.scale;
    const displayedHeight = imageDimensions.height * transform.scale;

    // Calculate how much the image exceeds the container
    const excessX = Math.max(0, (displayedWidth - containerRect.width) / 2);
    const excessY = Math.max(0, (displayedHeight - containerRect.height) / 2);

    return {
      minX: -excessX,
      maxX: excessX,
      minY: -excessY,
      maxY: excessY,
    };
  }, [imageDimensions, transform.scale]);

  // Constrain translation within bounds
  const constrainTranslation = useCallback(
    (x: number, y: number, scale: number) => {
      const container = containerRef.current;
      if (!container || !imageDimensions) return { x, y };

      const containerRect = container.getBoundingClientRect();
      const displayedWidth = imageDimensions.width * scale;
      const displayedHeight = imageDimensions.height * scale;

      const excessX = Math.max(0, (displayedWidth - containerRect.width) / 2);
      const excessY = Math.max(0, (displayedHeight - containerRect.height) / 2);

      return {
        x: Math.max(-excessX, Math.min(excessX, x)),
        y: Math.max(-excessY, Math.min(excessY, y)),
      };
    },
    [imageDimensions]
  );

  // Animate to transform
  const animateTo = useCallback(
    (newTransform: Partial<Transform>, duration = ANIMATION_DURATION) => {
      setIsAnimating(true);
      setTransform((prev) => ({
        ...prev,
        ...newTransform,
      }));
      setTimeout(() => setIsAnimating(false), duration);
    },
    []
  );

  // Reset to initial state
  const resetTransform = useCallback(() => {
    animateTo({ scale: 1, translateX: 0, translateY: 0 });
  }, [animateTo]);

  // Handle double tap zoom
  const handleDoubleTap = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = clientX - rect.left - rect.width / 2;
      const centerY = clientY - rect.top - rect.height / 2;

      if (transform.scale > 1.1) {
        // Zoom out
        animateTo({ scale: 1, translateX: 0, translateY: 0 });
      } else {
        // Zoom in to 2.5x at tap point
        const newScale = 2.5;
        const constrained = constrainTranslation(
          -centerX * (newScale - 1),
          -centerY * (newScale - 1),
          newScale
        );
        animateTo({
          scale: newScale,
          translateX: constrained.x,
          translateY: constrained.y,
        });
      }
    },
    [transform.scale, animateTo, constrainTranslation]
  );

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      touchStateRef.current = {
        initialDistance: distance,
        initialScale: transform.scale,
        initialCenter: center,
        lastCenter: center,
      };
    } else if (e.touches.length === 1) {
      // Single touch - check for double tap
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (timeSinceLastTap < DOUBLE_TAP_DELAY && timeSinceLastTap > 0) {
        e.preventDefault();
        handleDoubleTap(e.touches[0].clientX, e.touches[0].clientY);
        lastTapRef.current = 0;
        return;
      }

      lastTapRef.current = now;

      // Start drag if zoomed
      if (transform.scale > 1) {
        isDraggingRef.current = true;
        lastPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        velocityRef.current = { x: 0, y: 0 };
      }
    }
  }, [transform.scale, handleDoubleTap]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && touchStateRef.current) {
        // Pinch zoom
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        const { initialDistance, initialScale, initialCenter } = touchStateRef.current;
        const scaleRatio = distance / initialDistance;
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, initialScale * scaleRatio));

        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const focalX = initialCenter.x - rect.left - rect.width / 2;
          const focalY = initialCenter.y - rect.top - rect.height / 2;

          // Calculate new translation based on focal point
          const scaleDiff = newScale / initialScale;
          let newX = transform.translateX - focalX * (scaleDiff - 1);
          let newY = transform.translateY - focalY * (scaleDiff - 1);

          // Add pan movement
          newX += center.x - touchStateRef.current.lastCenter.x;
          newY += center.y - touchStateRef.current.lastCenter.y;

          touchStateRef.current.lastCenter = center;

          const constrained = constrainTranslation(newX, newY, newScale);
          setTransform({
            scale: newScale,
            translateX: constrained.x,
            translateY: constrained.y,
          });
        }
      } else if (e.touches.length === 1 && isDraggingRef.current) {
        // Pan
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastPosRef.current.x;
        const deltaY = touch.clientY - lastPosRef.current.y;

        velocityRef.current = { x: deltaX, y: deltaY };
        lastPosRef.current = { x: touch.clientX, y: touch.clientY };

        setTransform((prev) => {
          const constrained = constrainTranslation(
            prev.translateX + deltaX,
            prev.translateY + deltaY,
            prev.scale
          );
          return {
            ...prev,
            translateX: constrained.x,
            translateY: constrained.y,
          };
        });
      }
    },
    [transform, constrainTranslation]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchStateRef.current = null;

      if (isDraggingRef.current) {
        isDraggingRef.current = false;

        // Apply momentum
        const velocity = velocityRef.current;
        if (Math.abs(velocity.x) > 5 || Math.abs(velocity.y) > 5) {
          setTransform((prev) => {
            const constrained = constrainTranslation(
              prev.translateX + velocity.x * 3,
              prev.translateY + velocity.y * 3,
              prev.scale
            );
            return {
              ...prev,
              translateX: constrained.x,
              translateY: constrained.y,
            };
          });
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 300);
        }
      }

      // Reset if scale is below 1
      if (transform.scale < 1 && e.touches.length === 0) {
        resetTransform();
      }
    },
    [transform.scale, constrainTranslation, resetTransform]
  );

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = e.clientX - rect.left - rect.width / 2;
      const centerY = e.clientY - rect.top - rect.height / 2;

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale * (1 + delta)));

      const scaleDiff = newScale / transform.scale;
      let newX = transform.translateX - centerX * (scaleDiff - 1);
      let newY = transform.translateY - centerY * (scaleDiff - 1);

      const constrained = constrainTranslation(newX, newY, newScale);
      setTransform({
        scale: newScale,
        translateX: constrained.x,
        translateY: constrained.y,
      });
    },
    [transform, constrainTranslation]
  );

  // Mouse drag for desktop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (transform.scale <= 1) return;

      isDraggingRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    },
    [transform.scale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - lastPosRef.current.x;
      const deltaY = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };

      setTransform((prev) => {
        const constrained = constrainTranslation(
          prev.translateX + deltaX,
          prev.translateY + deltaY,
          prev.scale
        );
        return {
          ...prev,
          translateX: constrained.x,
          translateY: constrained.y,
        };
      });
    },
    [constrainTranslation]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Double click for desktop
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      handleDoubleTap(e.clientX, e.clientY);
    },
    [handleDoubleTap]
  );

  // Image URL
  const imageUrl = useMemo(
    () =>
      getImageUrl(fileKey, isPublic, {
        width: 2560,
        quality: 92,
        format: 'auto',
        fit: 'contain',
      }),
    [fileKey, isPublic]
  );

  // Low-res placeholder
  const placeholderUrl = useMemo(
    () =>
      getImageUrl(fileKey, isPublic, {
        width: 64,
        quality: 30,
        format: 'webp',
      }),
    [fileKey, isPublic]
  );

  // Handle image load
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      // Calculate displayed size based on object-fit: contain
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = containerRect.width / containerRect.height;

        let displayWidth: number;
        let displayHeight: number;

        if (imgAspect > containerAspect) {
          displayWidth = containerRect.width;
          displayHeight = containerRect.width / imgAspect;
        } else {
          displayHeight = containerRect.height;
          displayWidth = containerRect.height * imgAspect;
        }

        setImageDimensions({ width: displayWidth, height: displayHeight });
      }
      setIsLoaded(true);
      onLoadComplete?.();
    },
    [onLoadComplete]
  );

  // Reset transform when fileKey changes
  useEffect(() => {
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
    setIsLoaded(false);
    onLoadStart?.();
  }, [fileKey, onLoadStart]);

  // Prevent body scroll when zoomed
  useEffect(() => {
    if (transform.scale > 1) {
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.touchAction = '';
    };
  }, [transform.scale]);

  const transformStyle = useMemo(
    () => ({
      transform: `translate3d(${transform.translateX}px, ${transform.translateY}px, 0) scale(${transform.scale})`,
      transition: isAnimating ? `transform ${ANIMATION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none',
      willChange: 'transform',
    }),
    [transform, isAnimating]
  );

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden bg-black/90 touch-none select-none ${className ?? ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: transform.scale > 1 ? 'grab' : 'zoom-in' }}
    >
      {/* Low-res placeholder with blur */}
      <img
        src={placeholderUrl}
        alt=""
        className={`absolute inset-0 h-full w-full object-contain blur-xl scale-105 transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden
      />

      {/* Main image */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={transformStyle}
        onLoad={handleImageLoad}
        draggable={false}
      />

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        </div>
      )}

      {/* Zoom indicator */}
      {transform.scale > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
          {Math.round(transform.scale * 100)}%
        </div>
      )}
    </div>
  );
}
