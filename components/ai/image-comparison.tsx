'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ImageComparisonProps {
  beforeImage: string
  afterImage: string
  className?: string
  beforeLabel?: string
  afterLabel?: string
}

export function ImageComparison({
  beforeImage,
  afterImage,
  className,
  beforeLabel = '原图',
  afterLabel = 'AI修图'
}: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  const handleTouchMove = (e: React.TouchEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e)
    const handleGlobalMouseUp = () => setIsDragging(false)
    const handleGlobalTouchMove = (e: TouchEvent) => handleTouchMove(e)
    const handleGlobalTouchEnd = () => setIsDragging(false)

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.addEventListener('touchmove', handleGlobalTouchMove)
      document.addEventListener('touchend', handleGlobalTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [isDragging])

  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800', className)}>
      {/* 容器 */}
      <div
        ref={containerRef}
        className="relative w-full h-full cursor-col-resize select-none"
        onMouseMove={handleMouseMove}
        style={{ aspectRatio: '16/10' }}
      >
        {/* 原图（底层） */}
        <div className="absolute inset-0">
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="w-full h-full object-contain"
            draggable={false}
          />
          
          {/* 原图标签 */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full backdrop-blur-sm">
            {beforeLabel}
          </div>
        </div>

        {/* 修图后（顶层，通过clip-path控制显示区域） */}
        <div 
          className="absolute inset-0 transition-all duration-100 ease-out"
          style={{
            clipPath: `polygon(${sliderPosition}% 0%, 100% 0%, 100% 100%, ${sliderPosition}% 100%)`
          }}
        >
          <img
            src={afterImage}
            alt={afterLabel}
            className="w-full h-full object-contain"
            draggable={false}
          />
          
          {/* 修图后标签 */}
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full backdrop-blur-sm">
            {afterLabel}
          </div>
        </div>

        {/* 分割线和滑块 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 cursor-col-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* 滑块手柄 */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg cursor-col-resize flex items-center justify-center hover:scale-110 transition-transform"
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            {/* 双箭头图标 */}
            <svg 
              className="w-4 h-4 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 9l4-4 4 4m0 6l-4 4-4-4" 
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 进度指示器 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-4 px-4 py-2 bg-black/50 text-white text-sm rounded-full backdrop-blur-sm">
          <span className={cn('transition-opacity', sliderPosition < 30 ? 'opacity-100' : 'opacity-60')}>
            {beforeLabel}
          </span>
          <div className="flex items-center space-x-1">
            <div className="w-16 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{ width: `${sliderPosition}%` }}
              />
            </div>
          </div>
          <span className={cn('transition-opacity', sliderPosition > 70 ? 'opacity-100' : 'opacity-60')}>
            {afterLabel}
          </span>
        </div>
      </div>

      {/* 快速切换按钮 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className="flex bg-black/50 rounded-full overflow-hidden backdrop-blur-sm">
          <button
            onClick={() => setSliderPosition(0)}
            className={cn(
              'px-3 py-1 text-sm transition-colors',
              sliderPosition < 25 ? 'bg-white text-black' : 'text-white hover:bg-white/20'
            )}
          >
            原图
          </button>
          <button
            onClick={() => setSliderPosition(50)}
            className={cn(
              'px-3 py-1 text-sm transition-colors',
              sliderPosition >= 25 && sliderPosition <= 75 ? 'bg-white text-black' : 'text-white hover:bg-white/20'
            )}
          >
            对比
          </button>
          <button
            onClick={() => setSliderPosition(100)}
            className={cn(
              'px-3 py-1 text-sm transition-colors',
              sliderPosition > 75 ? 'bg-white text-black' : 'text-white hover:bg-white/20'
            )}
          >
            修图
          </button>
        </div>
      </div>
    </div>
  )
}