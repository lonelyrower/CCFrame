"use client"

import { useCallback, useEffect, useState } from "react"
import { Laptop2, Moon, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"

const MODES: Array<{
  value: "light" | "dark" | "system"
  icon: JSX.Element
  label: string
  emoji: string
}> = [
  { value: "light", icon: <SunMedium className="h-4 w-4 sm:h-3.5 sm:w-3.5" />, label: "Light", emoji: "☀️" },
  { value: "dark", icon: <Moon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />, label: "Dark", emoji: "🌙" },
  { value: "system", icon: <Laptop2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />, label: "System", emoji: "💻" },
]

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleThemeChange = useCallback((newTheme: string) => {
    setIsChanging(true)
    setTheme(newTheme)

    // 添加短暂延迟以显示动画效果
    setTimeout(() => setIsChanging(false), 300)
  }, [setTheme])

  // 键盘快捷键支持 (Ctrl/Cmd + Shift + T)
  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault()
        const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
        handleThemeChange(nextTheme)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [theme, mounted, handleThemeChange])

  if (!mounted) {
    return (
      <div className="glass-card flex items-center gap-2 rounded-full px-3 py-2 text-sm shadow-soft backdrop-blur-md animate-pulse">
        <div className="hidden sm:inline-flex h-4 w-16 bg-muted rounded"></div>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-full p-2 sm:p-1.5 bg-muted/50 w-8 h-8 sm:w-7 sm:h-7"></div>
          ))}
        </div>
      </div>
    )
  }

  const modeLabel = resolvedTheme === "dark" ? "夜间模式" : "日间模式"
  const currentMode = MODES.find(mode => mode.value === theme) || MODES[2] // fallback to system

  return (
    <div className="glass-enhanced flex items-center gap-2 rounded-full px-3 py-2 text-sm shadow-soft group hover:shadow-lg theme-transition hover:scale-[1.02] will-change-transform">
      {/* 桌面端标签 */}
      <span
        className="hidden sm:inline-flex text-xs font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground"
        title="快捷键: Ctrl+Shift+T / ⌘+Shift+T"
      >
        {modeLabel}
      </span>

      {/* 移动端当前模式指示器 */}
      <span className="sm:hidden text-xs font-medium text-muted-foreground flex items-center gap-1">
        <span className="transition-transform duration-200 group-hover:scale-110">
          {currentMode.emoji}
        </span>
      </span>

      <div className="flex items-center gap-0.5 sm:gap-1">
        {MODES.map((mode) => {
          const isActive = theme === mode.value || (!theme && mode.value === "system")
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => handleThemeChange(mode.value)}
              disabled={isChanging}
              className={`
                touch-target rounded-full p-2 sm:p-1.5 transition-all duration-200 relative overflow-hidden
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                active:scale-90 disabled:cursor-not-allowed disabled:opacity-50
                ${isActive
                  ? "bg-primary text-primary-foreground shadow-md transform scale-105 ring-2 ring-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105"
                }
                ${isChanging ? "animate-pulse" : ""}
                touch-manipulation select-none
                before:absolute before:inset-0 before:rounded-full before:bg-white/20 before:opacity-0 before:transition-opacity before:duration-200
                hover:before:opacity-100
              `}
              aria-pressed={isActive}
              aria-label={`切换到${mode.label}模式`}
              title={`切换到${mode.label}模式`}
            >
              <div className={`transition-transform duration-200 ${isActive ? "rotate-0" : "group-hover:rotate-12"}`}>
                {mode.icon}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

