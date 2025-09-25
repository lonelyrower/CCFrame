"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Search, Trash2, Download, Upload, X, Image, Folder, Tag as TagIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFavorites, type FavoriteItem } from '@/hooks/use-favorites'

interface FavoritesPanelProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

const typeFilters = [
  { id: 'all', label: '全部', icon: Heart },
  { id: 'photo', label: '作品', icon: Image },
  { id: 'album', label: '专辑', icon: Folder },
  { id: 'tag', label: '标签', icon: TagIcon }
] as const

export function FavoritesPanel({
  isOpen,
  onClose,
  className
}: FavoritesPanelProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | FavoriteItem['type']>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const {
    favorites,
    isLoading,
    removeFromFavorites,
    clearFavorites,
    searchFavorites,
    getFavoritesByType,
    exportFavorites,
    importFavorites,
    count
  } = useFavorites()

  // Filter favorites
  const filteredFavorites = (() => {
    let items = activeFilter === 'all'
      ? favorites
      : getFavoritesByType(activeFilter as FavoriteItem['type'])

    if (searchQuery.trim()) {
      items = searchFavorites(searchQuery)
      if (activeFilter !== 'all') {
        items = items.filter(item => item.type === activeFilter)
      }
    }

    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  })()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportFavorites()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await importFavorites(file)
      alert('收藏夹导入成功！')
    } catch (error) {
      console.error('Import failed:', error)
      alert('导入失败，请检查文件格式')
    }

    // Reset input
    event.target.value = ''
  }

  const getTypeIcon = (type: FavoriteItem['type']) => {
    switch (type) {
      case 'photo':
        return Image
      case 'album':
        return Folder
      case 'tag':
        return TagIcon
      default:
        return Heart
    }
  }

  const getTypeLabel = (type: FavoriteItem['type']) => {
    switch (type) {
      case 'photo':
        return '作品'
      case 'album':
        return '专辑'
      case 'tag':
        return '标签'
      default:
        return '项目'
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return diffMinutes <= 1 ? '刚刚' : `${diffMinutes}分钟前`
      }
      return `${diffHours}小时前`
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className={cn("fixed inset-0 z-50 flex items-center justify-center", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-black/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-rose-400" />
              <h2 className="text-xl font-light text-white" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>
                我的收藏
              </h2>
              {count > 0 && (
                <span className="px-3 py-1 bg-white/10 text-white/70 rounded-full text-sm font-light">
                  {count}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Import */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <div className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <Upload className="h-4 w-4" />
                </div>
              </label>

              {/* Export */}
              <button
                onClick={handleExport}
                disabled={isExporting || count === 0}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="导出收藏"
              >
                {isExporting ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white/60 rounded-full" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>

              {/* Clear all */}
              <button
                onClick={clearFavorites}
                disabled={count === 0}
                className="p-2 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="清空收藏"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-white/10">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                placeholder="搜索收藏..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-colors"
                style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
              />
            </div>

            {/* Type Filters */}
            <div className="flex gap-2">
              {typeFilters.map((filter) => {
                const IconComponent = filter.icon
                const isActive = activeFilter === filter.id
                const filterCount = filter.id === 'all'
                  ? count
                  : getFavoritesByType(filter.id as FavoriteItem['type']).length

                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-light transition-colors",
                      isActive
                        ? "bg-white/15 text-white border border-white/20"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{filter.label}</span>
                    {filterCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-white/20 text-xs rounded-full">
                        {filterCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin h-8 w-8 border-2 border-white/20 border-t-white/60 rounded-full" />
              </div>
            ) : filteredFavorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 font-light mb-2">
                  {searchQuery ? '没有找到匹配的收藏' : '还没有收藏任何内容'}
                </p>
                <p className="text-white/40 text-sm font-light">
                  {searchQuery ? '尝试其他搜索词' : '开始探索作品并添加到收藏吧'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFavorites.map((favorite, index) => {
                  const IconComponent = getTypeIcon(favorite.type)

                  return (
                    <motion.div
                      key={`${favorite.type}-${favorite.id}`}
                      className="group relative bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 hover:border-white/20 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Type indicator */}
                      <div className="flex items-center gap-2 mb-3">
                        <IconComponent className="h-4 w-4 text-white/60" />
                        <span className="text-xs font-light text-white/50 uppercase tracking-wider">
                          {getTypeLabel(favorite.type)}
                        </span>
                        <span className="ml-auto text-xs font-light text-white/40">
                          {formatDate(favorite.createdAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-white font-light mb-2 line-clamp-2" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                        {favorite.title}
                      </h3>

                      {/* Metadata */}
                      {favorite.metadata?.description && (
                        <p className="text-white/60 text-sm font-light line-clamp-2 mb-3">
                          {favorite.metadata.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Navigate to item
                            console.log('Navigate to:', favorite)
                          }}
                          className="flex-1 px-3 py-1.5 bg-white/10 text-white/80 text-xs font-light rounded-lg hover:bg-white/20 transition-colors"
                        >
                          查看
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromFavorites(favorite.id, favorite.type)
                          }}
                          className="p-1.5 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="移除收藏"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}