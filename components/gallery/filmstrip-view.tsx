'use client'

import Image from 'next/image'
import { memo, useMemo, useRef, useState, useCallback } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface FilmstripViewProps {
  entries: FilmstripEntry[]
  activeId?: string | null
  onSelect?: (id: string) => void
}

export interface FilmstripEntry {
  id: string
  src: string
  width: number
  height: number
}

export const FilmstripView = memo(function FilmstripView({ entries, activeId, onSelect }: FilmstripViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragState = useRef<{ pointerId: number; startX: number; scrollLeft: number } | null>(null)
  const wasDraggingRef = useRef(false)

  const positions = useMemo(() => {
    let offset = 0
    return entries.map((entry) => {
      const width = Math.max(110, Math.min(220, (entry.width / entry.height) * 60))
      const position = { left: offset, width }
      offset += width + 12
      return position
    })
  }, [entries])

  const totalWidth = positions.length ? positions[positions.length - 1].left + positions[positions.length - 1].width : 0
  const activeIndex = activeId ? entries.findIndex((entry) => entry.id === activeId) : -1

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container) return
    setDragging(true)
    wasDraggingRef.current = false
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: container.scrollLeft,
    }
    container.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }, [])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    const state = dragState.current
    if (!container || !state || state.pointerId !== event.pointerId) return
    const delta = event.clientX - state.startX
    container.scrollLeft = state.scrollLeft - delta
    if (!wasDraggingRef.current && Math.abs(delta) > 4) {
      wasDraggingRef.current = true
    }
  }, [])

  const clearDragState = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null
    }
    container?.releasePointerCapture?.(event.pointerId)
    setDragging(false)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative h-28 w-full cursor-grab overflow-x-auto overflow-y-hidden rounded-3xl border border-contrast-outline/15 bg-contrast-surface/40 p-3 shadow-inner active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearDragState}
      onPointerLeave={(event) => {
        if (!dragging) return
        clearDragState(event)
      }}
      onPointerCancel={clearDragState}
    >
      <div className="relative h-full" style={{ width: Math.max(totalWidth, containerRef.current?.clientWidth ?? 0) }}>
        <AnimatePresence initial={false}>
          {entries.map((entry, index) => {
            const isActive = entry.id === activeId
            const position = positions[index]
            return (
              <motion.button
                key={entry.id}
                type="button"
                className="absolute top-0 h-22 overflow-hidden rounded-xl border border-contrast-outline/10 bg-contrast-surface/50"
                style={{ left: position.left, width: position.width }}
                animate={{ opacity: isActive ? 1 : 0.75 }}
                whileHover={{ opacity: 1 }}
                whileTap={{ scale: 0.96 }}
                onClick={(event) => {
                  event.preventDefault()
                  if (wasDraggingRef.current) {
                    wasDraggingRef.current = false
                    return
                  }
                  onSelect?.(entry.id)
                }}
              >
                <div className="relative h-full w-full">
                  <Image src={entry.src} alt={entry.id} fill sizes="(max-width: 768px) 40vw, 18vw" className="object-cover" />
                </div>
                {isActive ? (
                  <motion.span layoutId="filmstrip-highlight" className="pointer-events-none absolute inset-0 rounded-xl border-2 border-primary/70" />
                ) : null}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
})
