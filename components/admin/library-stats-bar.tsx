'use client'

import { Eye, EyeOff, Image as ImageIcon, AlertTriangle } from 'lucide-react'

interface LibraryStats {
  total: number
  public: number
  private: number
  processing: number
}

export function LibraryStatsBar({ stats }: { stats: LibraryStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <ImageIcon className="w-5 h-5 text-blue-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总计</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Eye className="w-5 h-5 text-green-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">公开</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.public}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <EyeOff className="w-5 h-5 text-orange-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">私密</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.private}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">处理中</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.processing}</p>
          </div>
        </div>
      </div>
    </div>
  )
}