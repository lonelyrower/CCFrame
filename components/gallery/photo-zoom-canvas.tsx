"use client"
import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/utils'
import type { PhotoWithDetails } from '@/types'
import { useDominantColor } from './use-dominant-color'

interface Props { photo: PhotoWithDetails }

export function PhotoZoomCanvas({ photo }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const pinchState = useRef<null | { startDist: number; startScale: number; midX: number; midY: number; startOffset: {x:number;y:number} }>(null)
  const [origin, setOrigin] = useState({ x: 0, y: 0 })
  const [loaded, setLoaded] = useState(false)
  const [blurDataUrl, setBlurDataUrl] = useState<string | null>(null)
  const lastTapRef = useRef(0)
  const avgColor = useDominantColor(photo.id, !photo.blurhash)

  // Decode blurhash client-side (lightweight canvas) only if present
  useEffect(() => {
    if (!photo.blurhash) return
    let active = true
    ;(async () => {
      try {
        const { decode } = await import('blurhash')
        const hash = photo.blurhash!
        const pixels = decode(hash, 32, 32) // small placeholder
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const imageData = ctx.createImageData(32, 32)
        imageData.data.set(pixels)
        ctx.putImageData(imageData, 0, 0)
        if (active) setBlurDataUrl(canvas.toDataURL('image/png'))
      } catch (e) {
        // fail silently
      }
    })()
    return () => { active = false }
  }, [photo.blurhash])

  // dominant color now handled by hook

  const clampOffset = useCallback((candidate: { x: number; y: number }, nextScale: number) => {
    const container = containerRef.current
    if (!container) return candidate
    const rect = container.getBoundingClientRect()
    const containerWidth = rect.width
    const containerHeight = rect.height
    if (!containerWidth || !containerHeight) return candidate
    const aspect = photo.width / photo.height
    let baseWidth = containerWidth
    let baseHeight = baseWidth / aspect
    if (baseHeight > containerHeight) {
      baseHeight = containerHeight
      baseWidth = baseHeight * aspect
    }
    const excessX = Math.max(0, (baseWidth * nextScale - containerWidth) / (2 * nextScale))
    const excessY = Math.max(0, (baseHeight * nextScale - containerHeight) / (2 * nextScale))
    return {
      x: Math.min(excessX, Math.max(-excessX, candidate.x)),
      y: Math.min(excessY, Math.max(-excessY, candidate.y))
    }
  }, [photo.width, photo.height])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(s => {
      const next = Math.min(5, Math.max(1, parseFloat((s + delta).toFixed(2))))
      setOffset(prev => next === 1 ? { x: 0, y: 0 } : clampOffset(prev, next))
      return next
    })
  }, [clampOffset])

  const activePointers = useRef<Map<number, {x:number;y:number}>>(new Map())

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // track pointers for pinch
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values())
      const dx = pts[0].x - pts[1].x
      const dy = pts[0].y - pts[1].y
      const dist = Math.hypot(dx, dy)
      const midX = (pts[0].x + pts[1].x) / 2
      const midY = (pts[0].y + pts[1].y) / 2
      pinchState.current = { startDist: dist, startScale: scale, midX, midY, startOffset: { ...offset } }
    } else if (scale > 1) {
      setDragging(true)
      setOrigin({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }, [scale, offset])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }
    // Pinch gesture
    if (pinchState.current && activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values())
      const dx = pts[0].x - pts[1].x
      const dy = pts[0].y - pts[1].y
      const dist = Math.hypot(dx, dy)
      const ratio = dist / pinchState.current.startDist
      let nextScale = Math.min(5, Math.max(1, parseFloat((pinchState.current.startScale * ratio).toFixed(2))))
      // Keep midpoint roughly stable: adjust offset so that midpoint stays under same image point.
      const { midX, midY, startOffset, startScale } = pinchState.current
      // Translate midpoint relative difference
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const cx = midX - rect.left
        const cy = midY - rect.top
        const scaleRatio = nextScale / startScale
        const newX = cx - (cx - startOffset.x) * scaleRatio
        const newY = cy - (cy - startOffset.y) * scaleRatio
        setOffset(clampOffset({ x: newX, y: newY }, nextScale))
      }
      setScale(nextScale)
      return
    }
    // Drag pan
    if (dragging) {
      const candidate = { x: e.clientX - origin.x, y: e.clientY - origin.y }
      setOffset(clampOffset(candidate, scale))
    }
  }, [dragging, origin, clampOffset, scale])

  const clearPointer = useCallback((id: number) => {
    activePointers.current.delete(id)
    if (activePointers.current.size < 2) pinchState.current = null
  }, [])
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    clearPointer(e.pointerId)
    setDragging(false)
    const now = Date.now()
    if (e.pointerType === 'touch' && lastTapRef.current && now - lastTapRef.current < 300) {
      setScale(prevScale => {
        const next = prevScale === 1 ? 2 : 1
        if (next === 1) {
          setOffset({ x: 0, y: 0 })
        } else {
          const container = containerRef.current
          if (container) {
            const rect = container.getBoundingClientRect()
            const cx = e.clientX - rect.left
            const cy = e.clientY - rect.top
            const candidate = {
              x: rect.width / 2 - cx,
              y: rect.height / 2 - cy,
            }
            setOffset(clampOffset(candidate, next))
          } else {
            setOffset(prev => clampOffset(prev, next))
          }
        }
        return next
      })
    }
    lastTapRef.current = now
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }, [clearPointer, clampOffset])

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    clearPointer(e.pointerId)
    setDragging(false)
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }, [clearPointer])

  const onDoubleClick = useCallback((e?: React.MouseEvent) => {
    setScale(prevScale => {
      const next = prevScale === 1 ? 2 : 1
      if (next === 1) {
        setOffset({ x: 0, y: 0 })
      } else if (e) {
        const container = containerRef.current
        if (container) {
          const rect = container.getBoundingClientRect()
          const cx = e.clientX - rect.left
          const cy = e.clientY - rect.top
          const candidate = {
            x: rect.width / 2 - cx,
            y: rect.height / 2 - cy,
          }
          setOffset(clampOffset(candidate, next))
        }
      } else {
        setOffset(prev => clampOffset(prev, next))
      }
      return next
    })
  }, [clampOffset])

  // Listen to custom zoom events dispatched by keyboard shortcuts in Lightbox context
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ delta: number }>
      if (!custom.detail) return
      setScale(s => {
        const next = Math.min(5, Math.max(1, parseFloat((s + custom.detail.delta).toFixed(2))))
        if (next === 1) {
          setOffset({ x: 0, y: 0 })
        } else {
          setOffset(prev => clampOffset(prev, next))
        }
        return next
      })
    }
    document.addEventListener('lightbox-zoom', handler as EventListener)
    return () => document.removeEventListener('lightbox-zoom', handler as EventListener)
  }, [clampOffset])

  return (
    <div
      ref={containerRef}
      className="relative max-w-full max-h-[80vh] lg:max-h-[90vh] select-none cursor-grab active:cursor-grabbing touch-none outline-none"
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
      <div
        style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`, transition: dragging ? 'none' : 'transform 0.15s ease-out' }}
        className="origin-center relative"
      >
        {(blurDataUrl || (!photo.blurhash && !loaded)) && !loaded && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blurDataUrl || getImageUrl(photo.id, 'thumb', 'webp')}
            aria-hidden
            alt=""
            className="max-w-full max-h-[80vh] lg:max-h-[90vh] object-contain rounded-lg shadow-2xl blur-md scale-105 select-none"
            style={avgColor ? { background: `linear-gradient(135deg, ${avgColor}, ${avgColor} 60%)` } : undefined}
          />
        )}
        <Image
          src={getImageUrl(photo.id, 'large', 'webp')}
          alt={photo.album?.title || 'Photo'}
          width={photo.width}
          height={photo.height}
          className={`max-w-full max-h-[80vh] lg:max-h-[90vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          priority
          onLoad={() => setLoaded(true)}
        />
      </div>
      {scale !== 1 && (
        <div className="absolute bottom-2 right-2 text-xs px-2 py-1 bg-black/50 text-white rounded">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  )
}
