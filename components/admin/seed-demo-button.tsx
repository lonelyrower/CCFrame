'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, Download } from 'lucide-react'
import toast from 'react-hot-toast'

export function SeedDemoButton({ count: propCount }: { count?: number }) {
  const [loading, setLoading] = useState(false)
  const [defaultCount, setDefaultCount] = useState(propCount || 12)
  const [selectedCount, setSelectedCount] = useState(propCount || 12)
  const [showOptions, setShowOptions] = useState(false)

  // 获取设置中的默认导入数量
  useEffect(() => {
    const fetchDefaultCount = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const settings = await response.json()
          const defaultValue = settings.apis?.defaultSeedCount || propCount || 12
          setDefaultCount(defaultValue)
          if (!propCount) { // 只有在没有传入props时才使用设置值
            setSelectedCount(defaultValue)
          }
        }
      } catch (error) {
        console.error('获取设置失败:', error)
      }
    }

    fetchDefaultCount()
  }, [propCount])

  const countOptions = [3, 6, 12, 18, 24, 30]

  const seed = async () => {
    setLoading(true)
    try {
      // 显示开始导入的提示
      toast.loading('正在导入示例图片，请稍候...', { id: 'import-loading' })
      
      const res = await fetch('/api/dev/seed/pixabay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-seed-token': 'dev-seed-123'  // 生产环境授权token
        },
        body: JSON.stringify({ count: selectedCount, query: 'nature', visibility: 'PUBLIC' }),
      })
      
      // 关闭loading toast
      toast.dismiss('import-loading')
      
      if (!res.ok) {
        // 处理非JSON响应（如HTML错误页面）
        const contentType = res.headers.get('content-type')
        if (contentType?.includes('text/html')) {
          throw new Error(`服务器错误 (${res.status}): 请求超时或服务器繁忙`)
        }
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(data?.error || `请求失败 (${res.status})`)
      }
      
      const data = await res.json()
      toast.success(`已导入 ${data.seeded || 0} 张示例图片`)
      
      // 等待2秒后刷新页面
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (e: any) {
      toast.dismiss('import-loading')
      console.error('导入错误:', e)
      toast.error(e?.message || '导入失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Button onClick={seed} disabled={loading} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          {loading ? '导入中...' : `导入 ${selectedCount} 张示例图片`}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowOptions(!showOptions)}
          disabled={loading}
          className="px-2"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {showOptions && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">选择数量:</div>
            {countOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setSelectedCount(option)
                  setShowOptions(false)
                }}
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  selectedCount === option 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {option} 张
              </button>
            ))}
            
            <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                💡 建议首次导入3-6张
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

