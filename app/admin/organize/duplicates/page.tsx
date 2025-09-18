'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

type Cluster = {
  primaryId: string
  ids: string[]
}

export default function DuplicatesPage() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [threshold, setThreshold] = useState(8)
  const [limit, setLimit] = useState(500)

  const scan = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/duplicates/scan?limit=${limit}&threshold=${threshold}`)
      if (!res.ok) throw new Error('扫描失败')
      const data = await res.json()
      setClusters(data.clusters || [])
      toast.success(`发现 ${data.clusters?.length || 0} 组相似/重复照片`)
    } catch (e: any) {
      toast.error(e?.message || '扫描失败')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id: string) => setSelected(s => ({ ...s, [id]: !s[id] }))

  const deleteSelected = async () => {
    const toDelete = Object.keys(selected).filter(id => selected[id])
    if (toDelete.length === 0) return
    if (!confirm(`确定删除 ${toDelete.length} 张照片？该操作不可撤销。`)) return
    setLoading(true)
    try {
      for (const id of toDelete) {
        const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('删除失败')
      }
      toast.success('删除完成')
      await scan()
      setSelected({})
    } catch (e: any) {
      toast.error(e?.message || '删除失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { scan() }, [limit, threshold])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">重复/相似 照片整理</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">基于感知哈希相似度，建议删除多余副本</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm">阈值</label>
            <input type="number" min={0} max={64} value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value || '8'))} className="w-20 px-2 py-1 border rounded" />
            <label className="text-sm">扫描数量</label>
            <input type="number" min={50} max={2000} value={limit} onChange={(e) => setLimit(parseInt(e.target.value || '500'))} className="w-24 px-2 py-1 border rounded" />
            <Button onClick={scan} disabled={loading}>{loading ? '扫描中...' : '重新扫描'}</Button>
          </div>
        </div>

        {clusters.length === 0 ? (
          <div className="text-center text-gray-500">未发现重复/相似的照片</div>
        ) : (
          <div className="space-y-6">
            {clusters.map((c, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">主保留：<span className="font-medium">{c.primaryId}</span></div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {c.ids.map((id) => (
                    <label key={id} className={`relative block aspect-square rounded overflow-hidden border ${id === c.primaryId ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'}`}>
                      <img src={`/api/image/${id}/thumb?format=webp`} alt={`Duplicate photo ${id}`} className="w-full h-full object-cover" />
                      {id !== c.primaryId && (
                        <input type="checkbox" className="absolute top-2 left-2 w-4 h-4" checked={!!selected[id]} onChange={() => toggle(id)} />
                      )}
                      {id === c.primaryId && (
                        <span className="absolute top-1 right-1 text-xs bg-green-500 text-white px-1 rounded">保留</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {clusters.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button variant="destructive" onClick={deleteSelected} disabled={loading}>删除所选</Button>
          </div>
        )}
      </div>
    </div>
  )
}

