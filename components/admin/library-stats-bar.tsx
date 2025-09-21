"use client"

import { AlertTriangle, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface LibraryStats {
  total: number
  public: number
  private: number
  processing: number
}

interface LibraryStatsBarProps {
  stats: LibraryStats
  className?: string
}

export function LibraryStatsBar({ stats, className }: LibraryStatsBarProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4 md:grid-cols-4', className)}>
      <div className="rounded-xl border border-surface-outline/40 bg-surface-panel/80 p-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-primary/10 p-2 text-primary">
            <ImageIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-medium text-text-muted">Total</p>
            <p className="text-2xl font-semibold text-text-primary">{stats.total}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-outline/40 bg-surface-panel/80 p-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100/15 p-2 text-emerald-500 dark:text-emerald-300">
            <Eye className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-medium text-text-muted">Public</p>
            <p className="text-2xl font-semibold text-text-primary">{stats.public}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-outline/40 bg-surface-panel/80 p-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-orange-100/15 p-2 text-orange-500 dark:text-orange-300">
            <EyeOff className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-medium text-text-muted">Private</p>
            <p className="text-2xl font-semibold text-text-primary">{stats.private}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-outline/40 bg-surface-panel/80 p-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-100/15 p-2 text-amber-500 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-medium text-text-muted">Processing</p>
            <p className="text-2xl font-semibold text-text-primary">{stats.processing}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
