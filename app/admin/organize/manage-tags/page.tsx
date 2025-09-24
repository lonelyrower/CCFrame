'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { fadeInScale, listItemRise, createStaggerPreset } from '@/lib/motion/presets'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Copy, Tags } from 'lucide-react'

type Tag = { id: string; name: string; color: string; _count?: { photos: number } }

const samplePreviewStagger = createStaggerPreset({ amount: 0.06, delayChildren: 0.02 })
const tagGridStagger = createStaggerPreset({ amount: 0.08, delayChildren: 0.04 })

export default function ManageTagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<Tag | null>(null)
  const [targetId, setTargetId] = useState<string>('')
  const [affected, setAffected] = useState<number | null>(null)
  const [colorTouched, setColorTouched] = useState(false)
  const [sampleIds, setSampleIds] = useState<string[]>([])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tags
    return tags.filter(t => t.name.toLowerCase().includes(q))
  }, [query, tags])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tags')
      const data = await res.json()
      setTags(data.tags || [])
    } catch (e) {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const saveEdit = async () => {
    if (!editing) return
    try {
      const res = await fetch(`/api/admin/tags/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editing.name, color: editing.color })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '保存失败')
      }
      toast.success('已保存')
      setEditing(null)
      load()
    } catch (e: any) {
      toast.error(e?.message || '保存失败')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('确定删除该标签？与照片的关联将被移除。')) return
    try {
      const res = await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      toast.success('已删除')
      load()
    } catch (e: any) {
      toast.error(e?.message || '删除失败')
    }
  }

  const merge = async () => {
    if (!targetId || selected.length === 0) return
    if (!confirm(`确定合并 ${selected.length} 个标签到目标标签？此操作不可撤销。`)) return
    try {
      const res = await fetch('/api/admin/tags/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, sourceIds: selected })
      })
      if (!res.ok) throw new Error('合并失败')
      toast.success('已合并')
      setSelected([])
      setTargetId('')
      load()
    } catch (e: any) {
      toast.error(e?.message || '合并失败')
    }
  }

  useEffect(() => {
    if (selected.length === 0) { setAffected(null); return }
    const qs = new URLSearchParams({ sourceIds: selected.join(',') }).toString()
    fetch(`/api/admin/tags/preview-merge?${qs}`)
      .then(r => r.json())
      .then(d => setAffected(d.affected || 0))
      .catch(() => setAffected(null))
    fetch(`/api/admin/tags/preview-merge/photos?${qs}&limit=12`)
      .then(r => r.json())
      .then(d => setSampleIds(d.photos || []))
      .catch(() => setSampleIds([]))
  }, [selected])

  const suggestColor = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('红')) return '#ef4444'
    if (n.includes('橙') || n.includes('黄')) return '#f59e0b'
    if (n.includes('绿')) return '#22c55e'
    if (n.includes('青')) return '#06b6d4'
    if (n.includes('蓝')) return '#3b82f6'
    if (n.includes('紫')) return '#8b5cf6'
    if (n.includes('粉')) return '#ec4899'
    if (/[bw灰黑白]/.test(n)) return '#6b7280'
    return '#6b7280'
  }

  return (
    <div className="space-y-12 pb-20 pt-6">
      <Container size="xl" bleed="none" className="space-y-6">
        <AnimateOnScroll variants={fadeInScale}>
          <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
            <div className="space-y-2">
              <Heading size="md" className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" />
                标签管理
              </Heading>
              <Text tone="secondary" size="sm">编辑标签名称、颜色，合并或删除标签</Text>
              <div className="flex items-center gap-4 text-sm">
                <Link
                  href="/admin/organize/duplicates"
                  className="inline-flex items-center text-sm text-primary transition-colors hover:text-primary/80"
                >
                  <Copy className="mr-1 h-4 w-4" />
                  重复照片 检测
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索标签"
                  className="w-full rounded-md border border-surface-outline/50 bg-surface-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-64"
                />
                <Button onClick={load} disabled={loading}>
                  {loading ? '加载中...' : '刷新'}
                </Button>
              </div>
              {affected !== null ? (
                <Text tone="secondary" size="sm" className="sm:ml-auto">预计影响 {affected} 张照片</Text>
              ) : null}
            </div>
          </Surface>
        </AnimateOnScroll>

        {sampleIds.length > 0 && (
          <AnimateOnScroll variants={fadeInScale} delay={0.08}>
            <Surface tone="panel" padding="lg" className="shadow-subtle space-y-3">
              <Text tone="secondary" size="sm">受影响图片预览</Text>
              <AnimateOnScroll variants={samplePreviewStagger} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {sampleIds.map((id) => (
                  <AnimateOnScroll key={id} variants={listItemRise} className="block">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-outline/20">
                      <Image
                        src={`/api/image/${id}/thumb?format=webp`}
                        alt="Photo sample for tag management"
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                  </AnimateOnScroll>
                ))}
              </AnimateOnScroll>
            </Surface>
          </AnimateOnScroll>
        )}

        <AnimateOnScroll variants={fadeInScale} delay={0.12}>
          <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
            <Text tone="secondary" size="sm">共 {filtered.length} 个标签</Text>
            <AnimateOnScroll variants={tagGridStagger} className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tag) => (
                <AnimateOnScroll key={tag.id} variants={listItemRise} className="h-full">
                  <Surface
                    tone="canvas"
                    padding="md"
                    className="flex h-full items-center justify-between gap-3 border border-surface-outline/40"
                  >
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(tag.id)}
                        onChange={() => toggle(tag.id)}
                        className="h-4 w-4 rounded border-surface-outline/60 text-primary focus:ring-primary/30"
                      />
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded" style={{ backgroundColor: tag.color }} />
                        <span className="font-medium">{tag.name}</span>
                        <span className="text-xs text-text-secondary">({tag._count?.photos || 0})</span>
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setColorTouched(false); setEditing(tag) }}>编辑</Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(tag.id)}>删除</Button>
                    </div>
                  </Surface>
                </AnimateOnScroll>
              ))}
            </AnimateOnScroll>
          </Surface>
        </AnimateOnScroll>

        <AnimateOnScroll variants={fadeInScale} delay={0.16}>
          <Surface tone="panel" padding="lg" className="shadow-subtle flex flex-col gap-3 sm:flex-row sm:items-center">
            <Text tone="secondary" size="sm">合并已选标签到：</Text>
            <select
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              className="w-full rounded-md border border-surface-outline/50 bg-surface-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-64"
            >
              <option value="">选择目标标签</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
            <Button onClick={merge} disabled={!targetId || selected.length === 0}>执行合并</Button>
          </Surface>
        </AnimateOnScroll>
      </Container>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-contrast-surface/50 p-4">
          <div className="w-full max-w-md space-y-3 rounded-xl bg-surface-panel p-4 shadow-surface dark:bg-surface-canvas">
            <Heading size="sm">编辑标签</Heading>
            <div>
              <label className="mb-1 block text-sm">名称</label>
              <input
                value={editing.name}
                onChange={(event) => {
                  const newName = event.target.value
                  setEditing((prev) => {
                    if (!prev) return prev
                    const next = { ...prev, name: newName }
                    if (!colorTouched) next.color = suggestColor(newName)
                    return next
                  })
                }}
                className="w-full rounded-md border border-surface-outline/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">颜色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editing.color}
                  onChange={(event) => { setColorTouched(true); setEditing({ ...editing, color: event.target.value }) }}
                  className="h-10 w-14 rounded border border-surface-outline/40"
                />
                <input
                  value={editing.color}
                  onChange={(event) => { setColorTouched(true); setEditing({ ...editing, color: event.target.value }) }}
                  className="flex-1 rounded-md border border-surface-outline/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>取消</Button>
              <Button onClick={saveEdit}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

