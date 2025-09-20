"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, Grid3X3, List } from 'lucide-react'

type ViewMode = 'grid' | 'list'

interface LibraryControlsProps {
  initialFilter?: string
  initialViewMode?: ViewMode
}

export function LibraryControls({ initialFilter = '', initialViewMode = 'grid' }: LibraryControlsProps) {
  const [filter, setFilter] = useState(initialFilter)
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (filter.trim()) {
      params.set('filter', filter.trim())
    } else {
      params.delete('filter')
    }
    params.delete('page') // Reset to first page when searching
    router.push(`/admin/library?${params.toString()}`)
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    const params = new URLSearchParams(searchParams)
    params.set('view', mode)
    router.push(`/admin/library?${params.toString()}`)
  }

  return (
    <div className="relative flex items-center gap-4">
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="搜索照片..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </form>
      
      <button 
        onClick={() => setShowFilters(!showFilters)}
        className={`p-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors ${
          showFilters 
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        title="筛选选项"
      >
        <Filter className="w-4 h-4" />
      </button>
      
      <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <button 
          onClick={() => handleViewModeChange('grid')}
          className={`p-2 transition-colors ${
            viewMode === 'grid' 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          title="网格视图"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleViewModeChange('list')}
          className={`p-2 transition-colors ${
            viewMode === 'list' 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          title="列表视图"
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                照片状态
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">全部</option>
                <option value="COMPLETED">已完成</option>
                <option value="PROCESSING">处理中</option>
                <option value="ERROR">错误</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                可见性
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">全部</option>
                <option value="PUBLIC">公开</option>
                <option value="PRIVATE">私有</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                排序方式
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="createdAt_desc">最新上传</option>
                <option value="createdAt_asc">最早上传</option>
                <option value="title_asc">标题 A-Z</option>
                <option value="title_desc">标题 Z-A</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              取消
            </button>
            <button 
              onClick={() => {
                // Apply filters logic here
                setShowFilters(false)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              应用筛选
            </button>
          </div>
        </div>
      )}
    </div>
  )
}