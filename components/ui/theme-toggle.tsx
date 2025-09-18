"use client"

import { useEffect, useState } from "react"
import { Laptop2, Moon, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"

const MODES: Array<{ value: "light" | "dark" | "system"; icon: JSX.Element; label: string }> = [
  { value: "light", icon: <SunMedium className="h-4 w-4" />, label: "Light" },
  { value: "dark", icon: <Moon className="h-4 w-4" />, label: "Dark" },
  { value: "system", icon: <Laptop2 className="h-4 w-4" />, label: "System" },
]

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const modeLabel = resolvedTheme === "dark" ? "Night mode" : "Day mode"

  return (
    <div className="glass-card flex items-center gap-2 rounded-full px-3 py-2 text-sm shadow-soft backdrop-blur-md">
      <span className="hidden text-xs font-medium text-muted-foreground sm:inline-flex">{modeLabel}</span>
      <div className="flex items-center gap-1">
        {MODES.map((mode) => {
          const isActive = theme === mode.value || (!theme && mode.value === "system")
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => setTheme(mode.value)}
              className={`rounded-full p-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={isActive}
              aria-label={`Switch to ${mode.label}`}
            >
              {mode.icon}
            </button>
          )
        })}
      </div>
    </div>
  )
}
