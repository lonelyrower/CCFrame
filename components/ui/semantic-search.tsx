"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, Image, Tag, Camera, Clock, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'photo' | 'album' | 'tag'
  title: string
  description?: string
  thumbnail?: string
  relevance: number
  tags?: string[]
  createdAt?: Date
}

interface SemanticSearchProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

const searchSuggestions = [
  { text: '夕阳风景', icon: Camera, category: '自然风光' },
  { text: '都市夜景', icon: Image, category: '城市摄影' },
  { text: '人像特写', icon: Camera, category: '人物摄影' },
  { text: '黑白艺术', icon: Tag, category: '风格标签' },
  { text: '建筑几何', icon: Image, category: '建筑摄影' },
  { text: '街头抓拍', icon: Camera, category: '街拍摄影' }
]

const recentSearches = [
  '海边日落',
  '咖啡馆',
  '雨天街道',
  '花卉微距'
]

export function SemanticSearch({
  isOpen,
  onClose,
  className
}: SemanticSearchProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev =>
            Math.min(prev + 1, Math.max(searchResults.length - 1, searchSuggestions.length - 1))
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          event.preventDefault()
          if (query.trim()) {
            handleSearch(query)
          } else if (selectedIndex < searchSuggestions.length) {
            const suggestion = searchSuggestions[selectedIndex]
            setQuery(suggestion.text)
            handleSearch(suggestion.text)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, query, selectedIndex, searchResults.length])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setQuery(searchQuery)

    try {
      // Mock semantic search - in real app, this would call your AI search API
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock search results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'photo',
          title: `${searchQuery} - 专业摄影作品`,
          description: '通过AI语义分析找到的相关摄影作品',
          relevance: 0.95,
          tags: [searchQuery, '摄影', '艺术'],
          createdAt: new Date()
        },
        {
          id: '2',
          type: 'album',
          title: `${searchQuery}主题专辑`,
          description: '包含多张相关作品的主题合集',
          relevance: 0.87,
          tags: [searchQuery, '专辑'],
          createdAt: new Date()
        },
        {
          id: '3',
          type: 'tag',
          title: `#${searchQuery}`,
          description: '相关标签和分类',
          relevance: 0.79,
          tags: [searchQuery],
          createdAt: new Date()
        }
      ]

      setSearchResults(mockResults)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'photo':
        return Image
      case 'album':
        return Camera
      case 'tag':
        return Tag
      default:
        return Image
    }
  }

  const getTypeLabel = (type: SearchResult['type']) => {
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

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className={cn("fixed inset-0 z-50 flex items-start justify-center pt-[10vh]", className)}
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

        {/* Search Modal */}
        <motion.div
          ref={modalRef}
          className="relative w-full max-w-2xl mx-4 bg-black/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-white/10">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-light text-white" style={{ fontFamily: 'var(--token-typography-display-font-family)' }}>
              智能语义搜索
            </h2>
            <button
              onClick={onClose}
              className="ml-auto p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-6 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
              <input
                ref={inputRef}
                type="text"
                placeholder="描述你要找的内容，比如：夕阳风景、都市夜景、温馨咖啡馆..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(query)
                  }
                }}
                className="w-full pl-12 pr-16 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-colors text-lg font-light"
                style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}
              />
              <button
                onClick={() => handleSearch(query)}
                disabled={!query.trim() || isSearching}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-500/80 hover:bg-blue-500 disabled:bg-white/10 text-white disabled:text-white/50 rounded-xl transition-colors font-light disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  '搜索'
                )}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="text-white/50 font-light">快捷操作:</span>
              <div className="flex gap-2">
                <kbd className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs font-light">
                  ⌘K
                </kbd>
                <span className="text-white/40 font-light">打开搜索</span>
                <kbd className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs font-light ml-4">
                  ↑↓
                </kbd>
                <span className="text-white/40 font-light">选择</span>
                <kbd className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs font-light ml-4">
                  Enter
                </kbd>
                <span className="text-white/40 font-light">确认</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-white/20 border-t-blue-400 rounded-full mx-auto mb-4" />
                  <p className="text-white/60 font-light">AI正在分析搜索内容...</p>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-white/80 font-light mb-2 text-sm">
                    找到 {searchResults.length} 个相关结果
                  </h3>
                </div>
                <div className="space-y-2">
                  {searchResults.map((result, index) => {
                    const IconComponent = getTypeIcon(result.type)
                    const isSelected = index === selectedIndex

                    return (
                      <motion.div
                        key={result.id}
                        className={cn(
                          "group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-colors",
                          isSelected
                            ? "bg-white/15 border border-white/20"
                            : "bg-white/5 hover:bg-white/10"
                        )}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          // Navigate to result
                          console.log('Navigate to result:', result)
                          onClose()
                        }}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-xl",
                          result.type === 'photo' && "bg-blue-500/20 text-blue-400",
                          result.type === 'album' && "bg-purple-500/20 text-purple-400",
                          result.type === 'tag' && "bg-amber-500/20 text-amber-400"
                        )}>
                          <IconComponent className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-light truncate">
                              {result.title}
                            </h4>
                            <span className="text-xs font-light text-white/50 uppercase tracking-wider">
                              {getTypeLabel(result.type)}
                            </span>
                          </div>
                          {result.description && (
                            <p className="text-white/60 text-sm font-light line-clamp-1">
                              {result.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-light text-white/40">
                              相关度: {Math.round(result.relevance * 100)}%
                            </span>
                            {result.tags && result.tags.length > 0 && (
                              <div className="flex gap-1">
                                {result.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded-full font-light"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <ArrowRight className={cn(
                          "h-4 w-4 text-white/40 transition-colors",
                          isSelected && "text-white/80"
                        )} />
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ) : query ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 font-light mb-2">
                  没有找到相关内容
                </p>
                <p className="text-white/40 text-sm font-light">
                  尝试使用不同的关键词描述
                </p>
              </div>
            ) : (
              <div className="p-6">
                {/* Search Suggestions */}
                <div className="mb-6">
                  <h3 className="text-white/80 font-light mb-3 text-sm">
                    热门搜索建议
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {searchSuggestions.map((suggestion, index) => {
                      const IconComponent = suggestion.icon
                      const isSelected = !query && index === selectedIndex

                      return (
                        <motion.button
                          key={suggestion.text}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                            isSelected
                              ? "bg-white/15 border border-white/20"
                              : "bg-white/5 hover:bg-white/10"
                          )}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <IconComponent className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-white font-light text-sm">
                              {suggestion.text}
                            </p>
                            <p className="text-white/50 text-xs font-light">
                              {suggestion.category}
                            </p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white/80 font-light text-sm">
                        最近搜索
                      </h3>
                      <button className="text-white/50 hover:text-white/80 text-xs font-light transition-colors">
                        清除
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <motion.button
                          key={search}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-sm font-light transition-colors"
                          onClick={() => handleSuggestionClick(search)}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Clock className="h-3 w-3" />
                          {search}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}