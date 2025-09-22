'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import Image from 'next/image'

import { getImageUrl } from '@/lib/utils'
import type { PhotoWithDetails } from '@/types'

import { useDominantColor } from './use-dominant-color'

interface ZoomSource {
  src: string
  width?: number
  height?: number
}

interface PhotoZoomCanvasProps {
  photo: PhotoWithDetails
  resolveSource?: (scale: number) => ZoomSource | undefined
}

interface Point {
  x: number
  y: number
}

interface PinchState {
  startDist: number
  startScale: number
  anchor: Point
  startOffset: Point
}

const MIN_SCALE = 1
const MAX_SCALE = 5
const SCALE_STEP = 0.1

export function PhotoZoomCanvas({ photo, resolveSource }: PhotoZoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [blurDataUrl, setBlurDataUrl] = useState<string | null>(null)
  const pointerPositions = useRef(new Map<number, Point>())
  const pinchState = useRef<PinchState | null>(null)
  const lastTapRef = useRef(0)
  const avgColor = useDominantColor(photo.id, !photo.blurhash)

  const defaultSource = useMemo<ZoomSource>(() => ({
    src: getImageUrl(photo.id, 'large', 'webp'),
    width: photo.width ?? 2048,
    height: photo.height ?? 1365,
  }), [photo.id, photo.width, photo.height])

  const resolvedSource = useMemo(() => {
    const candidate = resolveSource?.(scale)
    if (!candidate || !candidate.src) {
      return defaultSource
    }
    return {
      src: candidate.src,
      width: candidate.width ?? defaultSource.width,
      height: candidate.height ?? defaultSource.height,
    }
  }, [resolveSource, scale, defaultSource])

  const [imageSource, setImageSource] = useState<ZoomSource>(resolvedSource)

  useEffect(() => {
    setImageSource(resolvedSource)
    setLoaded(false)
  }, [resolvedSource])

  useEffect(() => {
    if (!photo.blurhash) return
    let active = true
    ;(async () => {
      try {
        const { decode } = await import('blurhash')
        const pixels = decode(photo.blurhash!, 32, 32)
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const imageData = ctx.createImageData(32, 32)
        imageData.data.set(pixels)
        ctx.putImageData(imageData, 0, 0)
        if (active) {
          setBlurDataUrl(canvas.toDataURL('image/png'))
        }
      } catch {
        // ignore errors decoding blurhash
      }
    })()
    return () => {
      active = false
    }
  }, [photo.blurhash])

  const clampOffset = useCallback((candidate: Point, nextScale: number) => {
    const container = containerRef.current
    if (!container || !photo.width || !photo.height) return candidate

    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect()
    if (!containerWidth || !containerHeight) return candidate

    const aspect = photo.width / photo.height
    let baseWidth = containerWidth
    let baseHeight = baseWidth / aspect
    if (baseHeight > containerHeight) {
      baseHeight = containerHeight
      baseWidth = baseHeight * aspect
    }

    const extraX = Math.max(0, (baseWidth * nextScale - containerWidth) / (2 * nextScale))
    const extraY = Math.max(0, (baseHeight * nextScale - containerHeight) / (2 * nextScale))

    return {
      x: Math.min(extraX, Math.max(-extraX, candidate.x)),
      y: Math.min(extraY, Math.max(-extraY, candidate.y)),
    }
  }, [photo.width, photo.height])

  const applyScale = useCallback((nextScale: number, anchor?: Point) => {
    const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale))
    if (clampedScale === MIN_SCALE) {
      setScale(MIN_SCALE)
      setOffset({ x: 0, y: 0 })
      return
    }
    if (!anchor || !containerRef.current) {
      setScale(clampedScale)
      setOffset((prev) => clampOffset(prev, clampedScale))
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    const originX = anchor.x - rect.left
    const originY = anchor.y - rect.top
    setOffset((prev) => {
      const scaleRatio = clampedScale / scale
      const next = {
        x: originX - (originX - prev.x) * scaleRatio,
        y: originY - (originY - prev.y) * scaleRatio,
      }
      return clampOffset(next, clampedScale)
    })
    setScale(clampedScale)
  }, [clampOffset, scale])

  const onWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP
    applyScale(Number((scale + delta).toFixed(2)), { x: event.clientX, y: event.clientY })
  }, [applyScale, scale])

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointerPositions.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointerPositions.current.size === 2) {
      const [first, second] = Array.from(pointerPositions.current.values())
      const startDist = Math.hypot(first.x - second.x, first.y - second.y)
      const anchor = {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      }
      pinchState.current = {
        startDist,
        startScale: scale,
        anchor,
        startOffset: { ...offset },
      }
    } else if (scale > 1) {
      setDragging(true)
    }

    event.currentTarget.setPointerCapture?.(event.pointerId)
  }, [scale, offset])

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerPositions.current.has(event.pointerId)) return
    pointerPositions.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pinchState.current && pointerPositions.current.size === 2) {
      const [first, second] = Array.from(pointerPositions.current.values())
      const dist = Math.hypot(first.x - second.x, first.y - second.y)
      if (pinchState.current.startDist === 0) return
      const ratio = dist / pinchState.current.startDist
      const nextScale = Number((pinchState.current.startScale * ratio).toFixed(2))
      applyScale(nextScale, pinchState.current.anchor)
      return
    }

    if (dragging && scale > 1) {
      const start = pointerPositions.current.get(event.pointerId)
      if (!start) return
      const prev = pointerPositions.current.get(event.pointerId)
      if (!prev) return
      setOffset((previous) => {
        const dx = event.movementX + previous.x
        const dy = event.movementY + previous.y
        return clampOffset({ x: dx, y: dy }, scale)
      })
    }
  }, [applyScale, clampOffset, dragging, scale])

  const releasePointer = useCallback((pointerId: number) => {
    pointerPositions.current.delete(pointerId)
    if (pinchState.current && pointerPositions.current.size < 2) {
      pinchState.current = null
    }
  }, [])

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    releasePointer(event.pointerId)
    setDragging(false)

    const now = Date.now()
    if (event.pointerType === 'touch' && now - lastTapRef.current < 300) {
      const nextScale = scale === 1 ? 2 : 1
      applyScale(nextScale, { x: event.clientX, y: event.clientY })
    }
    lastTapRef.current = now
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }, [applyScale, releasePointer, scale])

  const onPointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    releasePointer(event.pointerId)
    setDragging(false)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }, [releasePointer])

  const onDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    const nextScale = scale === 1 ? 2 : 1
    applyScale(nextScale, { x: event.clientX, y: event.clientY })
  }, [applyScale, scale])

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ delta: number; anchor?: Point }>
      if (!custom.detail) return
      const next = Number((scale + custom.detail.delta).toFixed(2))
      applyScale(next, custom.detail.anchor)
    }

    document.addEventListener('lightbox-zoom', handler as EventListener)
    return () => document.removeEventListener('lightbox-zoom', handler as EventListener)
  }, [applyScale, scale])

  const transformStyle = useMemo(() => ({
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
    transition: dragging ? 'none' : 'transform 0.15s ease-out',
  }), [offset.x, offset.y, scale, dragging])

  const placeholderStyle = useMemo(() => {
    if (!avgColor) return undefined
    return { background: `linear-gradient(135deg, ${avgColor} 0%, rgba(0,0,0,0.6) 60%)` }
  }, [avgColor])

  return (
    <div
      ref={containerRef}
      className="relative max-h-[80vh] max-w-full select-none touch-none cursor-grab active:cursor-grabbing outline-none lg:max-h-[90vh]"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerCancel}
      onDoubleClick={onDoubleClick}
      role="figure"
      aria-label="Photo viewer"
    >
      <div style={transformStyle} className="relative origin-center">
        {(blurDataUrl || (!photo.blurhash && !loaded)) && !loaded ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blurDataUrl || getImageUrl(photo.id, 'thumb', 'webp')}
            aria-hidden
            alt=""
            className="max-h-[80vh] max-w-full select-none rounded-lg object-contain shadow-2xl blur-md lg:max-h-[90vh]"
            style={placeholderStyle}
          />
        ) : null}

        <Image
          src={imageSource.src}
          alt={photo.album?.title || 'Photo'}
          width={imageSource.width ?? photo.width ?? 2048}
          height={imageSource.height ?? photo.height ?? 1365}
          className="max-h-[80vh] max-w-full select-none rounded-lg object-contain shadow-2xl transition-opacity duration-300 lg:max-h-[90vh]"
          priority
          onLoad={() => setLoaded(true)}
          onError={(event) => {
            const el = event.target as HTMLImageElement
            const fallback = defaultSource.src
            if (el.src !== fallback) {
              el.src = fallback
            }
          }}
        />
      </div>

      {scale !== 1 ? (
        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white shadow">
          {Math.round(scale * 100)}%
        </div>
      ) : null}
    </div>
  )
}
