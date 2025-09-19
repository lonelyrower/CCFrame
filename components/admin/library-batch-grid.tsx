'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PhotoTagsInline } from '@/components/admin/photo-tags-inline'
import { PhotoActions } from '@/components/admin/photo-actions'
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Minus, 
  Move, 
  Trash2, 
  Download, 
  CheckSquare,
  Square,
  ChevronDown,
  Tag,
  FolderOpen
} from 'lucide-react'

type Tag = { id: string; name: string; color: string }
type PhotoItem = { id: string; visibility: 'PUBLIC' | 'PRIVATE'; width: number; height: number; albumTitle?: string | null; tags: Tag[] }

export function LibraryBatchGrid({ initial }: { initial: PhotoItem[] }) {
  const [items, setItems] = useState<PhotoItem[]>(initial)
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [addingTag, setAddingTag] = useState('')
  const [removingTag, setRemovingTag] = useState('')
  const [albums, setAlbums] = useState<{ id: string; title: string }[]>([])
  const [targetAlbum, setTargetAlbum] = useState<string>('')
  const selectedIds = useMemo(() => Object.keys(sel).filter(id => sel[id]), [sel])

  const toggle = (id: string) => setSel(s => ({ ...s, [id]: !s[id] }))
  const selectAll = () => setSel(Object.fromEntries(items.map(i => [i.id, true])))
  const clearSel = () => setSel({})

  const batchVisibility = async (visibility: 'PUBLIC' | 'PRIVATE') => {
    const ids = selectedIds
    for (const id of ids) {
      try { await fetch(`/api/photos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visibility }) }) } catch {}
    }
    setItems(arr => arr.map(x => (sel[x.id] ? { ...x, visibility } : x)))
  }

  const batchDelete = async () => {
    const ids = selectedIds
    if (ids.length === 0) return
    if (!confirm(`确定删除 ${ids.length} 张照片？此操作不可撤销。`)) return
    for (const id of ids) {
      try { await fetch(`/api/photos/${id}`, { method: 'DELETE' }) } catch {}
    }
    setItems(arr => arr.filter(x => !sel[x.id]))
    clearSel()
  }

  const batchAddTag = async () => {
    const name = addingTag.trim()
    if (!name) return
    const ids = selectedIds
    for (const id of ids) {
      try { await fetch(`/api/admin/photos/${id}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }) } catch {}
    }
    setAddingTag('')
  }

  const batchRemoveTag = async () => {
    const name = removingTag.trim()
    if (!name) return
    // resolve tag id from name
    let tagId = ''
    try {
      const r = await fetch(`/api/admin/tags?q=${encodeURIComponent(name)}&limit=1`)
      const d = await r.json()
      const t = (d.tags || [])[0]
      if (!t) return
      tagId = t.id
    } catch {}
    if (!tagId) return
    const ids = selectedIds
    for (const id of ids) {
      try { await fetch(`/api/admin/photos/${id}/tags?tagId=${encodeURIComponent(tagId)}`, { method: 'DELETE' }) } catch {}
    }
    setRemovingTag('')
  }

  const batchMoveToAlbum = async () => {
    const ids = selectedIds
    const payload = targetAlbum ? { albumId: targetAlbum } : { albumId: null }
    for (const id of ids) {
      try { await fetch(`/api/photos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }) } catch {}
    }
    // UI: nothing else to change here except maybe albumTitle, which we don't track beyond display
  }

  useEffect(() => {
    fetch('/api/albums')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : (d.albums || [])
        setAlbums(list.map((a: any) => ({ id: a.id, title: a.title })))
      })
      .catch(() => {})
  }, [])

  return (
    <>
      {/* 选择状态栏 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                已选择 <span className="text-blue-600 font-bold">{selectedIds.length}</span> 张照片
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAll} className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                全选
              </Button>
              <Button variant="outline" size="sm" onClick={clearSel}>
                清空选择
              </Button>
            </div>
          </div>
          
          {selectedIds.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              批量操作已激活
            </div>
          )}
        </div>

        {/* 批量操作区域 */}
        {selectedIds.length > 0 && (
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            {/* 第一行：可见性操作 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0">
                <Eye className="w-4 h-4 shrink-0" />
                <span className="shrink-0">可见性</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => batchVisibility('PUBLIC')} className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
                  <Eye className="w-3 h-3" />
                  设为公开
                </Button>
                <Button size="sm" variant="outline" onClick={() => batchVisibility('PRIVATE')} className="flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  设为私密
                </Button>
              </div>
            </div>

            {/* 第二行：标签操作 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0">
                <Tag className="w-4 h-4 shrink-0" />
                <span className="shrink-0">标签管理</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <input
                    value={addingTag}
                    onChange={(e) => setAddingTag(e.target.value)}
                    placeholder="添加标签"
                    className="w-32 h-8 text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  />
                  <Button size="sm" onClick={batchAddTag} className="flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    添加
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    value={removingTag}
                    onChange={(e) => setRemovingTag(e.target.value)}
                    placeholder="移除标签"
                    className="w-32 h-8 text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  />
                  <Button size="sm" variant="outline" onClick={batchRemoveTag} className="flex items-center gap-1">
                    <Minus className="w-3 h-3" />
                    移除
                  </Button>
                </div>
              </div>
            </div>

            {/* 第三行：相册操作 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0">
                <FolderOpen className="w-4 h-4 shrink-0" />
                <span className="shrink-0">相册管理</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select 
                  value={targetAlbum} 
                  onChange={(e) => setTargetAlbum(e.target.value)} 
                  className="w-40 h-8 text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none transition-all"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                  }}
                >
                  <option value="">移出相册</option>
                  {albums.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
                <Button size="sm" onClick={batchMoveToAlbum} className="flex items-center gap-1">
                  <Move className="w-3 h-3" />
                  移动
                </Button>
                <div className="flex items-center gap-1">
                  <input
                    id="newAlbumTitle"
                    placeholder="新建相册"
                    className="w-32 h-8 text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  />
                  <Button size="sm" variant="outline" onClick={async () => {
                    const input = document.getElementById('newAlbumTitle') as HTMLInputElement | null
                    const title = (input?.value || '').trim()
                    if (!title) return
                    try {
                      const res = await fetch('/api/albums', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, visibility: 'PRIVATE' }) })
                      if (!res.ok) throw new Error('创建失败')
                      const album = await res.json()
                      setAlbums(list => [...list, { id: album.id, title: album.title }])
                      setTargetAlbum(album.id)
                      input!.value = ''
                    } catch {}
                  }} className="flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    创建
                  </Button>
                </div>
              </div>
            </div>

            {/* 第四行：其他操作 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0">
                <span className="shrink-0">其他操作</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={async () => {
                  const ids = selectedIds
                  if (ids.length === 0) return
                  try {
                    const res = await fetch('/api/admin/photos/export-links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, variant: 'large', format: 'jpeg' }) })
                    if (!res.ok) throw new Error('导出失败')
                    const text = await res.text()
                    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `export_links_${Date.now()}.txt`
                    a.click()
                    URL.revokeObjectURL(url)
                  } catch {}
                }} className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  导出链接
                </Button>
                <Button size="sm" variant="destructive" onClick={batchDelete} className="flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                  删除选中
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 照片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
        {items.map(photo => (
          <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50">
            {/* 主图片 */}
            <Image
              src={`/api/image/${photo.id}/small`}
              alt={photo.albumTitle || 'Photo thumbnail'}
              fill
              sizes="(min-width: 1536px) 12vw, (min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, 50vw"
              className="object-cover transition-all duration-500 group-hover:scale-110"
            />

            {/* 选择框 - 改为现代化设计 */}
            <div className="absolute top-3 left-3">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={!!sel[photo.id]} 
                  onChange={() => toggle(photo.id)} 
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  sel[photo.id] 
                    ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/50' 
                    : 'bg-white/80 border-white/80 hover:bg-white hover:border-white backdrop-blur-sm'
                }`}>
                  {sel[photo.id] && (
                    <CheckSquare className="w-3 h-3 text-white" />
                  )}
                </div>
              </label>
            </div>

            {/* 照片操作按钮 */}
            <PhotoActions photoId={photo.id} visibility={photo.visibility} onChanged={(v) => {
              if (v === 'DELETED') setItems(arr => arr.filter(x => x.id !== photo.id))
              else setItems(arr => arr.map(x => x.id === photo.id ? { ...x, visibility: v } : x))
            }} />

            {/* 悬浮遮罩层 - 优化渐变效果 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* 信息栏 - 始终显示，但优化样式 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 backdrop-blur-sm">
              <div className="text-white text-sm space-y-2">
                {/* 相册标题 */}
                {photo.albumTitle && (
                  <div className="flex items-center gap-1 text-xs">
                    <FolderOpen className="w-3 h-3 text-blue-300" />
                    <span className="font-medium text-blue-200 truncate">{photo.albumTitle}</span>
                  </div>
                )}
                
                {/* 状态和尺寸信息 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                      photo.visibility === 'PUBLIC' 
                        ? 'bg-green-500/30 text-green-200 border border-green-400/30' 
                        : 'bg-orange-500/30 text-orange-200 border border-orange-400/30'
                    }`}>
                      {photo.visibility === 'PUBLIC' ? (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          公开
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          私密
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 font-mono bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                    {photo.width} × {photo.height}
                  </div>
                </div>
                
                {/* 标签显示 */}
                <div className="group-hover:opacity-100 transition-opacity duration-300">
                  <PhotoTagsInline photoId={photo.id} initial={photo.tags} />
                </div>
              </div>
            </div>

            {/* 选中状态的视觉反馈 */}
            {sel[photo.id] && (
              <div className="absolute inset-0 border-3 border-blue-500 rounded-xl pointer-events-none shadow-lg shadow-blue-500/50" />
            )}
          </div>
        ))}
      </div>
    </>
  )
}

