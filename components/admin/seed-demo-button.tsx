'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export function SeedDemoButton({ count = 12 }: { count?: number }) {
  const [loading, setLoading] = useState(false)

  const seed = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dev/seed/pixabay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-seed-token': 'dev-seed-123'  // 生产环境授权token
        },
        body: JSON.stringify({ count, query: 'nature', visibility: 'PUBLIC' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Seed failed')
      toast.success(`已导入 ${data.seeded || 0} 张示例图片`)
      // 触发刷新
      window.location.reload()
    } catch (e: any) {
      toast.error(e?.message || '导入失败')
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

