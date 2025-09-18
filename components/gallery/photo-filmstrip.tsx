"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { WheelEvent } from "react"
import Image from "next/image"
import { useLightbox } from "./lightbox-context"
import { getImageUrl } from "@/lib/utils"

const MAX_VISIBLE = 80

function computeWindow(total: number, index: number) {
  if (total <= MAX_VISIBLE) {
    return { start: 0, end: total }
  }
  const half = Math.floor(MAX_VISIBLE / 2)
  let start = Math.max(0, index - half)
  let end = start + MAX_VISIBLE
  if (end > total) {
    end = total
    start = Math.max(0, end - MAX_VISIBLE)
  }
  return { start, end }
}

export function PhotoFilmstrip() {
  const { photos, index, go } = useLightbox()
  const activeRef = useRef<HTMLButtonElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [fade, setFade] = useState({ left: false, right: false })

  const { slice, offset } = useMemo(() => {
    const total = photos.length
    if (total === 0) return { slice: [], offset: 0 }
    const { start, end } = computeWindow(total, index)
    return { slice: photos.slice(start, end), offset: start }
  }, [photos, index])

  const updateFade = useCallback(() => {
    const node = containerRef.current
    if (!node) return
    const { scrollLeft, scrollWidth, clientWidth } = node
    const maxScroll = Math.max(scrollWidth - clientWidth, 0)
    setFade({
      left: scrollLeft > 4,
      right: scrollLeft < maxScroll - 4,
    })
  }, [])

  useEffect(() => {
    if (!activeRef.current) return
    activeRef.current.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [slice, index])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    updateFade()
    const handleScroll = () => updateFade()
    node.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", updateFade)
    return () => {
      node.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", updateFade)
    }
  }, [updateFade])

  useEffect(() => {
    const frame = requestAnimationFrame(updateFade)
    return () => cancelAnimationFrame(frame)
  }, [slice, index, updateFade])

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const prefersHorizontal = Math.abs(event.deltaX) >= Math.abs(event.deltaY)
    if (prefersHorizontal) return // native horizontal scroll
    event.preventDefault()
    containerRef.current.scrollBy({ left: event.deltaY, behavior: "smooth" })
  }, [])

  if (slice.length <= 1) return null

  return (
    <div className="pointer-events-auto relative">
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto rounded-2xl bg-black/40 p-2 shadow-inner backdrop-blur touch-pan-x snap-x snap-mandatory"
        onWheel={handleWheel}
      >
        {slice.map((photo, i) => {
          const absoluteIndex = offset + i
          const isActive = absoluteIndex === index
          return (
            <button
              key={photo.id}
              type="button"
              ref={isActive ? activeRef : undefined}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                go(absoluteIndex)
              }}
              className={`relative h-14 w-16 flex-shrink-0 overflow-hidden rounded-xl transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black snap-center sm:h-16 sm:w-20 ${
                isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : 'opacity-60 hover:opacity-100'
              }`}
              aria-label={`Jump to photo ${absoluteIndex + 1}`}
            >
              <Image
                src={getImageUrl(photo.id, 'thumb', 'webp')}
                alt={photo.album?.title || photo.id}
                width={photo.width || 320}
                height={photo.height || 240}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {isActive && (
                <span className="absolute bottom-1 right-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                  {absoluteIndex + 1}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {fade.left && (
        <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-black/70 via-black/40 to-transparent" aria-hidden />
      )}
      {fade.right && (
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-black/70 via-black/40 to-transparent" aria-hidden />
      )}
    </div>
  )
}
