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
  { value: "light", icon: <SunMedium className="h-4 w-4 sm:h-3.5 sm:w-3.5" />, label: "明亮模式", emoji: "☀️" },
  { value: "dark", icon: <Moon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />, label: "暗色模式", emoji: "🌙" },
  { value: "system", icon: <Laptop2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />, label: "跟随系统", emoji: "💻" },
]

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleThemeChange = useCallback((newTheme: string) => {
    setIsChanging(true)
    setTheme(newTheme)

    // 短暂高亮以提示状态切换
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
        <div className="hidden sm:inline-flex h-4 w-16 bg-muted rounded" />
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-full p-2 sm:p-1.5 bg-muted/50 w-8 h-8 sm:w-7 sm:h-7" />
          ))}
        </div>
      </div>
    )
  }

  const modeLabel = resolvedTheme === "dark"
    ? "当前：暗色模式"
    : resolvedTheme === "light"
      ? "当前：明亮模式"
      : "当前：跟随系统"
  const currentMode = MODES.find(mode => mode.value === theme) || MODES[2]

  return (
    <div className="glass-enhanced flex items-center gap-2 rounded-full px-3 py-2 text-sm shadow-soft group hover:shadow-surface theme-transition hover:scale-[1.02] will-change-transform">
      {/* 桌面端文字提示 */}
      <span
        className="hidden sm:inline-flex text-xs font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground"
        title="快捷键：Ctrl+Shift+T / ⌘+Shift+T"
      >
        {modeLabel}
      </span>

      {/* 移动端使用表情指示 */}
      <span className="sm:hidden text-xs font-medium text-muted-foreground flex items-center gap-1" aria-hidden>
        <span className="transition-transform duration-200 group-hover:scale-110">
          {currentMode.emoji}
        </span>
      </span>

      <div className="flex items-center gap-0.5 sm:gap-1">
        {MODES.map((mode) => {
          const isActive = theme === mode.value || (!theme && mode.value === "system")
          const label = `切换到${mode.label}`
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
                  ? "bg-primary text-primary-foreground shadow-surface transform scale-105 ring-2 ring-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105"
                }
                ${isChanging ? "animate-pulse" : ""}
                touch-manipulation select-none
                before:absolute before:inset-0 before:rounded-full before:bg-surface-panel/20 before:opacity-0 before:transition-opacity before:duration-200
                hover:before:opacity-100
              `}
              aria-pressed={isActive}
              aria-label={label}
              title={label}
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

