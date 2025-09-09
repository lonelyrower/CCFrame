'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { Sparkles, Image as ImageIcon } from 'lucide-react'

export default function AIGeneratePage() {
  const [prompt, setPrompt] = useState('一只在森林里的狐狸，阳光散射，电影感')
  const [loading, setLoading] = useState(false)
  const [lastPhotoId, setLastPhotoId] = useState<string | null>(null)

  const generate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider: 'auto' })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '生成失败')
      }
      const data = await res.json()
      setLastPhotoId(data.photoId)
      toast.success('生成完成')
    } catch (e: any) {
      toast.error(e?.message || '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI 文生图
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">输入提示词，生成图片（默认私有）。需配置 OpenAI Key。</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div className="flex justify-end">
            <Button onClick={generate} disabled={loading}>{loading ? '生成中...' : '生成图片'}</Button>
          </div>
        </div>

        <div className="mt-6">
          {lastPhotoId ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">最新生成</div>
              <img src={`/api/image/${lastPhotoId}/large?format=webp`} className="w-full max-w-2xl rounded" />
            </div>
          ) : (
            <div className="text-gray-500 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> 无生成记录</div>
          )}
        </div>
      </div>
    </div>
  )
}

