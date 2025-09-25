"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Clock, Command, Loader2, Sparkles, UploadCloud, XCircle } from 'lucide-react'

import { useCommandPalette } from '@/components/providers/command-palette-provider'
import { useThemeSettings } from '@/components/providers/theme-settings-provider'
import { useUploadQueue } from '@/components/providers/upload-queue-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Surface } from '@/components/ui/surface'
import { Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import { featureFlags } from '@/lib/config/feature-flags'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const paletteVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -12 },
  visible: { opacity: 1, scale: 1, y: 0 },
}

export function AppOverlays() {
  if (!featureFlags.enableOverlays) {
    return null
  }

  return (
    <>
      <div className="pointer-events-none flex flex-col items-end gap-3">
        <ThemeQuickPanel />
        <UploadQueueToast />
      </div>
      {featureFlags.enableCommandPalette ? <CommandPaletteOverlay /> : null}
    </>
  )
}

function ThemeQuickPanel() {
  const { contrast, toggleContrast, motionPreference, setMotionPreference, resolvedMotion } = useThemeSettings()
  const [isVisible, setIsVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P 切换面板
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault()
        setIsVisible(prev => !prev)
      }
      // ESC 关闭面板
      if (event.key === 'Escape' && isVisible) {
        setIsVisible(false)
        setExpanded(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  // 自动隐藏逻辑：5秒后隐藏，更快隐藏减少干扰
  useEffect(() => {
    if (isVisible && !expanded) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, expanded])

  // 如果面板不可见，显示更隐蔽的触发按钮
  if (!isVisible) {
    return (
      <div className="pointer-events-auto fixed bottom-6 right-20 z-40 group">
        <motion.button
          type="button"
          onClick={() => setIsVisible(true)}
          className="rounded-full bg-surface-panel/60 hover:bg-surface-panel/80 border border-surface-outline/30 p-2 shadow-subtle backdrop-blur-sm transition-all hover:shadow-surface active:scale-95 opacity-60 hover:opacity-100"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ delay: 5, duration: 0.3 }}
          whileHover={{ scale: 1.05, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles className="h-4 w-4 text-text-muted" />
          <span className="sr-only">显示偏好设置 (Ctrl+Shift+P)</span>
        </motion.button>

        {/* 提示文字 */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-surface-panel/95 text-text-primary text-xs px-3 py-2 rounded-lg shadow-subtle backdrop-blur-sm whitespace-nowrap">
            显示偏好
            <div className="text-text-muted text-xs mt-0.5">Ctrl+Shift+P</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="pointer-events-auto w-full max-w-xs fixed right-6 top-20 md:relative md:right-auto md:top-auto"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
    >
      <Surface tone="panel" padding="md" className="shadow-subtle flex flex-col gap-3 relative border border-surface-outline/20">
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={() => {
            setIsVisible(false)
            setExpanded(false)
          }}
          className="absolute top-2 right-2 rounded-full p-1.5 text-text-muted hover:bg-surface-outline/20 hover:text-text-primary transition-colors"
        >
          <Command className="h-3.5 w-3.5 rotate-45" />
          <span className="sr-only">关闭 (ESC)</span>
        </button>

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="flex items-center justify-between gap-3 text-left pr-8"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Sparkles className="h-4 w-4 text-primary" />
            显示偏好
          </div>
          <Command className={cn('h-4 w-4 text-text-muted transition-transform duration-200', expanded && 'rotate-90')} />
        </button>

        {/* 折叠状态的简化控制 */}
        {!expanded && (
          <Text size="xs" tone="muted" className="text-center -mt-1">
            点击展开更多选项
          </Text>
        )}

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.33, 1, 0.68, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                <div className="space-y-2">
                  <Text size="xs" tone="secondary">主题偏好</Text>
                  <div className="flex justify-center">
                    <ThemeToggle />
                  </div>
                </div>

                <div className="border-t border-surface-outline/20 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <Text size="xs" tone="secondary">
                      高对比度
                    </Text>
                    <Button
                      type="button"
                      size="sm"
                      variant={contrast === 'high' ? 'default' : 'outline'}
                      onClick={toggleContrast}
                    >
                      {contrast === 'high' ? '已开启' : '开启'}
                    </Button>
                  </div>
                </div>

                <div className="border-t border-surface-outline/20 pt-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Text size="xs" tone="secondary">
                      动效偏好
                    </Text>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={motionPreference === 'system' ? 'default' : 'outline'}
                      onClick={() => setMotionPreference('system')}
                      className="flex-1"
                    >
                      跟随系统
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={motionPreference === 'reduce' ? 'default' : 'outline'}
                      onClick={() => setMotionPreference('reduce')}
                      className="flex-1"
                    >
                      减少动效
                    </Button>
                  </div>
                  <Text size="xs" tone="muted">
                    当前: {resolvedMotion === 'reduce' ? '最少动效' : '完整动效'}
                  </Text>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Surface>
    </motion.div>
  )
}

function UploadQueueToast() {
  const { items, stats, hasActive, clear } = useUploadQueue()

  if (stats.total === 0) {
    return null
  }

  const recent = items.slice(-3)

  return (
    <div className="pointer-events-auto w-full max-w-xs">
      <Surface tone="panel" padding="md" className="shadow-subtle space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UploadCloud className="h-4 w-4 text-primary" />
            Upload queue
          </div>
          {hasActive ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {stats.active + stats.pending} in progress
            </span>
          ) : (
            <span className="rounded-full bg-surface-outline/40 px-2 py-0.5 text-xs text-text-muted">
              {stats.completed} completed
            </span>
          )}
        </div>

        <div className="space-y-2">
          {recent.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1 truncate text-text-secondary">
                {item.filename}
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
          <span>
            Total {stats.total} · Success {stats.completed} · Failed {stats.failed}
          </span>
          {!hasActive && stats.total > 0 ? (
            <button
              type="button"
              className="text-primary hover:text-primary/80"
              onClick={clear}
            >
              Clear
            </button>
          ) : null}
        </div>
      </Surface>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-state-success">
          <CheckCircle2 className="h-3 w-3" /> Done
        </span>
      )
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-state-danger">
          <XCircle className="h-3 w-3" /> Failed
        </span>
      )
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-primary">
          <Loader2 className="h-3 w-3 animate-spin" /> Processing
        </span>
      )
    case 'uploading':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-primary">
          <Loader2 className="h-3 w-3 animate-spin" /> Uploading
        </span>
      )
    case 'hashing':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
          <Loader2 className="h-3 w-3 animate-spin" /> Hashing
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
          <Clock className="h-3 w-3" /> Pending
        </span>
      )
  }
}

function CommandPaletteOverlay() {
  const { isOpen, close, commands, execute } = useCommandPalette()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      const id = window.requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
      return () => window.cancelAnimationFrame(id)
    }
    return undefined
  }, [isOpen])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return commands
    return commands.filter((command) => {
      const haystack = [command.title, command.subtitle, ...(command.keywords ?? [])].join(' ').toLowerCase()
      return haystack.includes(normalized)
    })
  }, [commands, query])

  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(filtered.length - 1, 0))
    }
  }, [filtered, activeIndex])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % Math.max(filtered.length, 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const target = filtered[activeIndex]
      if (target) {
        execute(target.id)
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="pointer-events-auto fixed inset-0 z-[120] flex items-start justify-center bg-surface-outline/60 backdrop-blur-sm p-6"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              close()
            }
          }}
        >
          <motion.div
            className="w-full max-w-2xl"
            variants={paletteVariants}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <Surface tone="panel" padding="lg" className="shadow-floating space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-interaction-border bg-interaction-background px-3 py-2">
                <Command className="h-4 w-4 text-primary" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search actions, pages, or settings (Ctrl/Cmd + K)"
                  className="border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="max-h-[320px] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <div className="py-10 text-center text-sm text-text-muted">No matching commands</div>
                ) : (
                  <ul className="space-y-1">
                    {filtered.map((command, index) => (
                      <li key={command.id}>
                        <button
                          type="button"
                          onClick={() => execute(command.id)}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition',
                            index === activeIndex ? 'bg-primary/10 text-primary shadow-soft' : 'hover:bg-surface-outline/40',
                          )}
                        >
                          <div className="min-w-0">
                            <Text size="sm" weight="medium" className="truncate">
                              {command.title}
                            </Text>
                            {command.subtitle ? (
                              <Text size="xs" tone="muted" className="truncate">
                                {command.subtitle}
                              </Text>
                            ) : null}
                          </div>
                          {command.shortcut ? (
                            <div className="flex items-center gap-1">
                              {command.shortcut.map((key, idx) => (
                                <kbd
                                  key={`${command.id}-${key}-${idx}`}
                                  className="rounded-md border border-surface-outline/60 bg-interaction-muted px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Esc to close · Enter to run</span>
                <span>{filtered.length} command(s)</span>
              </div>
            </Surface>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

