'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { fadeInScale, listItemRise, createStaggerPreset } from '@/lib/motion/presets'
import toast from 'react-hot-toast'

type Cluster = {
  primaryId: string
  ids: string[]
}

const clusterStagger = createStaggerPreset({ amount: 0.06, delayChildren: 0.04 })

export default function DuplicatesPage() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [threshold, setThreshold] = useState(8)
  const [limit, setLimit] = useState(500)

  const scan = useCallback(async () => {
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
  }, [limit, threshold])

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

  useEffect(() => { scan() }, [scan])

  return (
    <div className="space-y-12 pb-20 pt-6">
      <Container size="xl" bleed="none" className="space-y-6">
        <AnimateOnScroll variants={fadeInScale}>
          <Surface tone="panel" padding="lg" className="shadow-subtle flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">�ظ�/���� ��Ƭ����</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">���ڸ�֪��ϣ���ƶȣ�����ɾ�����ั��</p>
            </div>
            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center">
              <label>��ֵ</label>
              <input
                type="number"
                min={0}
                max={64}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value || '8'))}
                className="w-24 rounded-md border border-surface-outline/50 bg-surface-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <label>ɨ������</label>
              <input
                type="number"
                min={50}
                max={2000}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value || '500'))}
                className="w-28 rounded-md border border-surface-outline/50 bg-surface-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button onClick={scan} disabled={loading}>{loading ? 'ɨ���С�' : '����ɨ��'}</Button>
            </div>
          </Surface>
        </AnimateOnScroll>

        {clusters.length === 0 ? (
          <AnimateOnScroll variants={fadeInScale} delay={0.08} className="text-center text-gray-500">δ�����ظ�/���Ƶ���Ƭ</AnimateOnScroll>
        ) : (
          <AnimateOnScroll variants={fadeInScale} delay={0.08} className="space-y-6">
            {clusters.map((cluster, index) => (
              <AnimateOnScroll key={cluster.primaryId ?? index} variants={fadeInScale}>
                <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">��������<span className="font-medium">{cluster.primaryId}</span></div>
                  <AnimateOnScroll variants={clusterStagger} className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                    {cluster.ids.map((id) => (
                      <AnimateOnScroll key={id} variants={listItemRise} className="block">
                        <label
                          className={`relative block aspect-square overflow-hidden rounded border ${id === cluster.primaryId ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'}`}
                        >
                          <Image
                            src={`/api/image/${id}/thumb?format=webp`}
                            alt={`Duplicate photo ${id}`}
                            fill
                            sizes="160px"
                            className="object-cover"
                          />
                          {id !== cluster.primaryId && (
                            <input
                              type="checkbox"
                              className="absolute top-2 left-2 h-4 w-4"
                              checked={!!selected[id]}
                              onChange={() => toggle(id)}
                            />
                          )}
                          {id === cluster.primaryId && (
                            <span className="absolute top-1 right-1 rounded bg-green-500 px-1 text-xs text-white">����</span>
                          )}
                        </label>
                      </AnimateOnScroll>
                    ))}
                  </AnimateOnScroll>
                </Surface>
              </AnimateOnScroll>
            ))}
          </AnimateOnScroll>
        )}

        {clusters.length > 0 && (
          <AnimateOnScroll variants={fadeInScale} delay={0.16}>
            <div className="flex justify-end">
              <Button variant="destructive" onClick={deleteSelected} disabled={loading}>ɾ����ѡ</Button>
            </div>
          </AnimateOnScroll>
        )}
      </Container>
    </div>
  )
}

