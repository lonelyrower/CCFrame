'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

type Tag = { id: string; name: string; color: string }

export function PhotoTagsInline({ photoId, initial }: { photoId: string; initial: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initial)
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')
  const [suggest, setSuggest] = useState<Tag[]>([])

  useEffect(() => {
    if (!input.trim()) { setSuggest([]); return }
    const ctrl = new AbortController()
    fetch(`/api/admin/tags?q=${encodeURIComponent(input)}&limit=10`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setSuggest(d.tags || []))
      .catch(() => {})
    return () => ctrl.abort()
  }, [input])

  const remove = async (tagId: string) => {
    try {
      const res = await fetch(`/api/admin/photos/${photoId}/tags?tagId=${encodeURIComponent(tagId)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      setTags(ts => ts.filter(t => t.id !== tagId))
    } catch {}
  }

  const add = async (name: string) => {
    if (!name.trim()) return
    try {
      const res = await fetch(`/api/admin/photos/${photoId}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
      if (!res.ok) throw new Error('添加失败')
      const data = await res.json()
      if (!tags.find(t => t.id === data.tag.id)) setTags([...tags, data.tag])
      setInput('')
      setAdding(false)
    } catch {}
  }

  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-1">
        {tags.map(t => (
          <span key={t.id} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${t.color}33`, color: t.color }}>
            {t.name}
            <button className="ml-1 opacity-70 hover:opacity-100" onClick={() => remove(t.id)}>×</button>
          </span>
        ))}
        {!adding ? (
          <button className="text-[11px] px-1 py-0.5 rounded bg-white/60 hover:bg-white border" onClick={() => setAdding(true)}>+ 标签</button>
        ) : (
          <div className="relative">
            <input className="text-[12px] px-2 py-1 border rounded bg-white" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { add(input) } if (e.key === 'Escape') setAdding(false) }} placeholder="输入并回车" />
            {suggest.length > 0 && (
              <div className="absolute z-10 mt-1 bg-white border rounded shadow w-40 max-h-40 overflow-auto">
                {suggest.map(s => (
                  <div key={s.id} className="px-2 py-1 text-[12px] hover:bg-gray-100 cursor-pointer" onClick={() => add(s.name)}>
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

