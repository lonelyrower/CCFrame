"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SemanticSearch } from './semantic-search'

interface FloatingAction {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut?: string
  onClick: () => void
  accent?: string
}

interface FloatingActionsProps {
  actions?: FloatingAction[]
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export function FloatingActions({
  className,
  position = 'bottom-right'
}: FloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const actions: FloatingAction[] = [
    {
      id: 'search',
      icon: Search,
      label: '搜索作品',
      shortcut: '⌘K / Ctrl+K',
      onClick: () => {
        setShowSearch(true)
        setIsOpen(false)
      },
      accent: 'text-blue-300'
    }
  ]

  // 外部点击关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 键盘快捷键
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setShowSearch(false)
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setShowSearch(true)
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const positionClasses = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'top-right': 'top-8 right-8',
    'top-left': 'top-8 left-8'
  }

  const actionPositions = {
    'bottom-right': (index: number) => ({ x: 0, y: -80 * (index + 1) }),
    'bottom-left': (index: number) => ({ x: 0, y: -80 * (index + 1) }),
    'top-right': (index: number) => ({ x: 0, y: 80 * (index + 1) }),
    'top-left': (index: number) => ({ x: 0, y: 80 * (index + 1) })
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed z-50 pointer-events-none',
        positionClasses[position],
        className
      )}
    >
      <AnimatePresence>
        {isOpen && actions.map((action, index) => {
          const IconComponent = action.icon
          const pos = actionPositions[position](index)

          return (
            <motion.div
              key={action.id}
              className="absolute pointer-events-auto"
              initial={{ opacity: 0, scale: 0.8, ...pos }}
              animate={{
                opacity: 1,
                scale: 1,
                ...pos,
                transition: {
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 500,
                  damping: 30
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                transition: { delay: (actions.length - index - 1) * 0.03 }
              }}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
            >
              <div className="relative flex items-center gap-3">
                <AnimatePresence>
                  {hoveredAction === action.id && (
                    <motion.div
                      className="absolute right-16 top-1/2 -translate-y-1/2"
                      initial={{ opacity: 0, x: 10, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 10, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="rounded-2xl border border-white/15 bg-black/80 px-4 py-2.5 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-light text-white" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                            {action.label}
                          </span>
                          {action.shortcut && (
                            <span className="rounded-lg bg-white/10 px-2 py-1 text-xs font-light text-white/60">
                              {action.shortcut}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={action.onClick}
                  className={cn(
                    'group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:bg-black/70 hover:border-white/25 hover:shadow-2xl',
                    'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent'
                  )}
                  aria-label={action.label}
                >
                  <IconComponent className={cn('h-5 w-5 transition-colors', action.accent || 'text-white/80 group-hover:text-white')} />

                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      <div className="pointer-events-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-black/40 backdrop-blur-xl transition-all duration-300',
            'hover:scale-105 hover:bg-black/60 hover:border-white/30 hover:shadow-2xl',
            'focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent',
            isOpen && 'bg-black/60 border-white/30 scale-105'
          )}
          aria-label={isOpen ? '关闭快捷操作' : '打开快捷操作'}
          aria-expanded={isOpen}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white/90" />
            ) : (
              <Plus className="h-6 w-6 text-white/80 group-hover:text-white" />
            )}
          </motion.div>

          <motion.div
            className="absolute inset-0 rounded-2xl bg-white/10 opacity-0"
            animate={{ opacity: isOpen ? 0.1 : 0, scale: isOpen ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
          />

          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>

      <SemanticSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </div>
  )
}
