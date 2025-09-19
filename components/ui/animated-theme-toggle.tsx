"use client"

import { useCallback, useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function AnimatedThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleThemeChange = useCallback(() => {
    if (isAnimating) return

    setIsAnimating(true)
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)

    // 动画结束后重置状态
    setTimeout(() => setIsAnimating(false), 1000)
  }, [resolvedTheme, setTheme, isAnimating])

  if (!mounted) {
    return (
      <div className="relative w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={handleThemeChange}
      disabled={isAnimating}
      className={`
        relative w-16 h-8 rounded-full border-2 transition-all duration-1000 ease-in-out overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        disabled:cursor-not-allowed
        ${isDark
          ? 'bg-slate-800 border-slate-600'
          : 'bg-sky-200 border-sky-400'
        }
      `}
      aria-label={`切换到${isDark ? '明亮' : '暗色'}模式`}
      title={`当前：${isDark ? '暗色' : '明亮'}模式`}
    >
      {/* 背景渐变 */}
      <div
        className={`
          absolute inset-0 transition-all duration-1000 ease-in-out
          ${isDark
            ? 'bg-gradient-to-r from-slate-900 to-slate-700'
            : 'bg-gradient-to-r from-sky-300 to-blue-200'
          }
        `}
      />

      {/* 太阳 */}
      <div
        className={`
          absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-1000 ease-in-out
          flex items-center justify-center
          ${isDark
            ? 'opacity-0 transform translate-x-8 scale-50'
            : 'opacity-100 transform translate-x-0 scale-100'
          }
          bg-gradient-to-br from-yellow-300 to-orange-400 shadow-lg
        `}
      >
        {/* 太阳光线 */}
        <div className={`
          absolute inset-0 rounded-full
          ${!isDark ? 'animate-spin' : ''}
        `}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-1 bg-yellow-200 rounded-full"
              style={{
                top: '-2px',
                left: '50%',
                transformOrigin: '1px 14px',
                transform: `rotate(${i * 45}deg) translateX(-0.5px)`
              }}
            />
          ))}
        </div>

        {/* 太阳表面 */}
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400" />
      </div>

      {/* 月亮 */}
      <div
        className={`
          absolute top-1 right-1 w-6 h-6 rounded-full transition-all duration-1000 ease-in-out
          flex items-center justify-center
          ${isDark
            ? 'opacity-100 transform translate-x-0 scale-100'
            : 'opacity-0 transform -translate-x-8 scale-50'
          }
          bg-gradient-to-br from-slate-200 to-slate-300 shadow-lg
        `}
      >
        {/* 月亮阴影 */}
        <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 opacity-30" />

        {/* 月亮陨石坑 */}
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 relative">
          <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-slate-300 opacity-60" />
          <div className="absolute bottom-1 right-0.5 w-0.5 h-0.5 rounded-full bg-slate-300 opacity-60" />
        </div>
      </div>

      {/* 星星 */}
      {isDark && (
        <div className="absolute inset-0">
          {[
            { top: '10%', left: '20%', delay: '0s' },
            { top: '70%', left: '15%', delay: '0.2s' },
            { top: '30%', left: '80%', delay: '0.4s' },
            { top: '80%', left: '75%', delay: '0.6s' },
          ].map((star, i) => (
            <div
              key={i}
              className={`
                absolute w-1 h-1 bg-white rounded-full opacity-0
                ${isDark ? 'animate-twinkle' : ''}
              `}
              style={{
                top: star.top,
                left: star.left,
                animationDelay: star.delay
              }}
            />
          ))}
        </div>
      )}

      {/* 云朵 (仅在明亮模式显示) */}
      {!isDark && (
        <div className="absolute top-2 left-8 opacity-60">
          <div className="relative">
            <div className="w-3 h-1.5 bg-white rounded-full" />
            <div className="absolute -top-0.5 left-1 w-2 h-1.5 bg-white rounded-full" />
            <div className="absolute -top-0.5 right-0.5 w-1.5 h-1 bg-white rounded-full" />
          </div>
        </div>
      )}
    </button>
  )
}