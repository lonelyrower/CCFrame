'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

type Album = { id: string; title: string }

export default function AutoTagsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [albumId, setAlbumId] = useState<string>('')
  const [limit, setLimit] = useState<number>(100)
  const [includeColors, setIncludeColors] = useState(true)
  const [includeContent, setIncludeContent] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/albums?limit=200')
      .then(r => r.json())
      .then(data => setAlbums(Array.isArray(data) ? data : (data.albums || [])))
      .catch(() => {})
  }, [])

  const run = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auto-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: albumId || undefined, limit, include: { colors: includeColors, content: includeContent } })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '执行失败')
      }
      const data = await res.json()
      toast.success(`已处理 ${data.processed}/${data.total} 张照片`)
    } catch (e: any) {
      toast.error(e?.message || '执行失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">自动标签</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">根据图片颜色与内容自动打标签（内容识别需配置 OpenAI 或 Gemini）。</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">相册（可选）</label>
              <select value={albumId} onChange={(e) => setAlbumId(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">全部照片</option>
                {albums.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">处理数量</label>
              <input type="number" min={10} max={500} value={limit} onChange={(e) => setLimit(parseInt(e.target.value || '100'))} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={includeColors} onChange={(e) => setIncludeColors(e.target.checked)} /> 颜色标签</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={includeContent} onChange={(e) => setIncludeContent(e.target.checked)} /> 内容标签</label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={run} disabled={loading}>{loading ? '执行中...' : '开始打标签'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
