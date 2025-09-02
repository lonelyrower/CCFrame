'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export function SeedDemoButton({ count = 3 }: { count?: number }) {
  const [loading, setLoading] = useState(false)

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
        body: JSON.stringify({ count, query: 'nature', visibility: 'PUBLIC' }),
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
    <Button onClick={seed} disabled={loading}>
      {loading ? '导入中...' : '导入示例图片'}
    </Button>
  )
}

