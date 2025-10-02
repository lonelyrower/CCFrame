"use client"

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ScrollIndicatorProps {
  itemCount: number
  className?: string
}

/**
 * 横向滚动指示器组件
 * 用于显示当前滚动位置和可用项目数量
 */
export function ScrollIndicator({ itemCount, className }: ScrollIndicatorProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current?.parentElement
    if (!scrollContainer) return

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft
      const itemWidth = scrollContainer.scrollWidth / itemCount
      const newIndex = Math.round(scrollLeft / itemWidth)
      setActiveIndex(Math.min(newIndex, itemCount - 1))
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [itemCount])

  if (itemCount <= 1) return null

  return (
    <div 
      ref={scrollRef}
      className={cn('flex items-center justify-center gap-2 py-4', className)}
      aria-label="滚动指示器"
    >
      {Array.from({ length: Math.min(itemCount, 10) }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            'h-1 rounded-full transition-all duration-300',
            index === activeIndex 
              ? 'w-8 bg-white/80' 
              : 'w-1 bg-white/30'
          )}
          initial={{ scale: 0.8 }}
          animate={{ scale: index === activeIndex ? 1 : 0.8 }}
          transition={{ duration: 0.3 }}
        />
      ))}
      {itemCount > 10 && (
        <span className="ml-2 text-xs text-white/50 font-light">
          {activeIndex + 1} / {itemCount}
        </span>
      )}
    </div>
  )
}
