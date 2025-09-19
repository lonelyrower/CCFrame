'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function StorageStrategyPage() {
  const [imageFormats, setImageFormats] = useState('')
  const [imageVariantNames, setImageVariantNames] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/storage-settings')
      if (!res.ok) return
      const data = await res.json()
      setImageFormats(data.imageFormats || '')
      setImageVariantNames(data.imageVariantNames || '')
    } catch {}
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/storage-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageFormats, imageVariantNames })
      })
      if (!res.ok) throw new Error('保存失败')
      toast.success('存储策略已保存')
    } catch (e: any) {
      toast.error(e?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回设置
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            存储策略
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            配置图片处理和存储相关参数
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                生成格式
              </label>
              <input
                type="text"
                value={imageFormats}
                onChange={(e) => setImageFormats(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="例如：webp,jpeg 或 avif,webp,jpeg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                逗号分隔，留空表示默认 avif,webp,jpeg。更改会影响后续新处理的图片；已生成的变体不受影响。
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                生成尺寸
              </label>
              <input
                type="text"
                value={imageVariantNames}
                onChange={(e) => setImageVariantNames(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="例如：thumb,small,medium,large"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                逗号分隔，留空表示默认 thumb,small,medium,large。
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <strong>注意：</strong> 并发与上传并行度（IMG_WORKER_CONCURRENCY / UPLOAD_CONCURRENCY）需通过环境变量配置，修改后重启生效。
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={save} disabled={saving} className="px-6">
                {saving ? '保存中...' : '保存更改'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
