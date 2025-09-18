'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { ServerCog } from 'lucide-react'

export default function StorageSettingsPage() {
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
      const res = await fetch('/api/admin/storage-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageFormats, imageVariantNames }) })
      if (!res.ok) throw new Error('保存失败')
      toast.success('已保存')
    } catch (e: any) { toast.error(e?.message || '保存失败') } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <ServerCog className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">存储策略设置</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm mb-1">生成格式（逗号分隔，例如：webp,jpeg 或 avif,webp,jpeg）</label>
            <input value={imageFormats} onChange={(e) => setImageFormats(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="留空表示默认 avif,webp,jpeg" />
            <p className="text-xs text-gray-500 mt-1">更改会影响后续新处理的图片；已生成的变体不受影响</p>
          </div>
          <div>
            <label className="block text-sm mb-1">生成尺寸（逗号分隔，例如：thumb,small,medium,large）</label>
            <input value={imageVariantNames} onChange={(e) => setImageVariantNames(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="留空表示默认 thumb,small,medium,large" />
          </div>
          <div className="text-xs text-amber-600">并发与上传并行度（IMG_WORKER_CONCURRENCY / UPLOAD_CONCURRENCY）需通过环境变量配置，修改后重启生效。</div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="px-6">{saving ? '保存中...' : '保存设置'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
