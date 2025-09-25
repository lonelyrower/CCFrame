"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Share, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShareMenu } from './share-menu'
import { FavoritesPanel } from './favorites-panel'
import { useFavorites } from '@/hooks/use-favorites'

interface FloatingAction {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut?: string
  onClick: () => void
  accent?: string
  badge?: number
}

interface FloatingActionsProps {
  actions?: FloatingAction[]
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  shareUrl?: string
  shareTitle?: string
  shareDescription?: string
}

export function FloatingActions({
  className,
  position = 'bottom-right',
  shareUrl,
  shareTitle,
  shareDescription
}: FloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { count: favoritesCount } = useFavorites()

  const actions: FloatingAction[] = [
    {
      id: 'favorites',
      icon: Heart,
      label: '我的收藏',
      shortcut: '⌘F',
      onClick: () => {
        setShowFavorites(true)
        setIsOpen(false)
      },
      accent: 'text-rose-300',
      badge: favoritesCount
    },
    {
      id: 'share',
      icon: Share,
      label: '分享展览',
      shortcut: '⌘S',
      onClick: () => {
        setShowShare(true)
        setIsOpen(false)
      },
      accent: 'text-amber-300'
    }
  ]

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts and escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setShowFavorites(false)
        setShowShare(false)
        return
      }

      // Handle shortcuts (Cmd on Mac, Ctrl on others)
      if (event.metaKey || event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case 'f':
            event.preventDefault()
            setShowFavorites(true)
            setIsOpen(false)
            break
          case 's':
            // Only handle if not in an input field
            if (!(event.target as Element)?.matches('input, textarea')) {
              event.preventDefault()
              setShowShare(true)
              setIsOpen(false)
            }
            break
        }
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
      {/* Action Items */}
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
                  type: "spring",
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
                {/* Tooltip */}
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

                {/* Action Button */}
                <button
                  onClick={action.onClick}
                  className={cn(
                    'group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:bg-black/70 hover:border-white/25 hover:shadow-2xl',
                    'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent'
                  )}
                  aria-label={action.label}
                >
                  <IconComponent className={cn('h-5 w-5 transition-colors', action.accent || 'text-white/80 group-hover:text-white')} />

                  {/* Badge */}
                  {action.badge !== undefined && action.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-medium text-white">
                      {action.badge > 99 ? '99+' : action.badge}
                    </span>
                  )}

                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Main Toggle Button */}
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
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white/90" />
            ) : (
              <Plus className="h-6 w-6 text-white/80 group-hover:text-white" />
            )}
          </motion.div>

          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-white/10 opacity-0"
            animate={{ opacity: isOpen ? 0.1 : 0, scale: isOpen ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* Background glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>

      {/* Modals */}
      <FavoritesPanel
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
      />

      <ShareMenu
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shareUrl={shareUrl}
        shareTitle={shareTitle}
        shareDescription={shareDescription}
      />
    </div>
  )
}