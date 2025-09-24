'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X, Tag } from 'lucide-react'

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
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <span 
            key={t.id} 
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm border transition-all duration-200 hover:scale-105" 
            style={{ 
              backgroundColor: `${t.color}20`, 
              color: t.color, 
              borderColor: `${t.color}40`,
              boxShadow: `0 0 8px ${t.color}20`
            }}
          >
            <Tag className="w-2.5 h-2.5" />
            {t.name}
            <button 
              className="ml-0.5 w-3 h-3 rounded-full bg-surface-panel/20 hover:bg-surface-panel/30 flex items-center justify-center transition-all duration-200 hover:scale-110" 
              onClick={() => remove(t.id)}
              title="移除标签"
            >
              <X className="w-2 h-2" />
            </button>
          </span>
        ))}
        
        {!adding ? (
          <button 
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-surface-panel/20 hover:bg-surface-panel/30 border border-contrast-outline/30 hover:border-contrast-outline/50 text-text-inverted transition-all duration-200 hover:scale-105 backdrop-blur-sm" 
            onClick={() => setAdding(true)}
            title="添加标签"
          >
            <Plus className="w-2.5 h-2.5" />
            标签
          </button>
        ) : (
          <div className="relative">
            <input 
              className="text-[11px] px-3 py-1.5 border border-contrast-outline/30 rounded-full bg-surface-panel/90 backdrop-blur-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all w-28" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => { 
                if (e.key === 'Enter') { add(input) } 
                if (e.key === 'Escape') { setAdding(false); setInput('') }
              }} 
              placeholder="输入标签名"
              autoFocus
            />
            {suggest.length > 0 && (
              <div className="absolute z-20 mt-1 bg-surface-panel/95 backdrop-blur-sm border border-surface-outline/40 rounded-lg shadow-floating w-40 max-h-32 overflow-auto">
                {suggest.map(s => (
                  <div 
                    key={s.id} 
                    className="flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-blue-50 cursor-pointer transition-colors border-b border-surface-outline/40 last:border-b-0" 
                    onClick={() => add(s.name)}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="font-medium text-text-secondary">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
            {/* 点击外部关闭输入框 */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => { setAdding(false); setInput('') }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

