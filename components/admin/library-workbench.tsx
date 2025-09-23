"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, LayoutList, LayoutPanelTop, RefreshCcw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Heading, Text } from '@/components/ui/typography'
import { LibraryStatsBar } from '@/components/admin/library-stats-bar'
import { LibraryTable } from '@/components/admin/library-table'
import { LibraryKanban } from '@/components/admin/library-kanban'
import { PhotoNoteDrawer } from '@/components/admin/photo-note-drawer'
import type { LibraryOverviewDto, LibraryTableItem, LibraryTableQuery, LibraryWorkflowStage } from '@/types/library'
import { cn } from '@/lib/utils'

interface LibraryWorkbenchProps {
  initialData: LibraryOverviewDto
  initialQuery?: Partial<LibraryTableQuery>
  initialView?: ViewMode
}

type ViewMode = 'table' | 'kanban'

export function LibraryWorkbench({ initialData, initialQuery, initialView = 'table' }: LibraryWorkbenchProps) {
  const [view, setView] = useState<ViewMode>(initialView)
  const [search, setSearch] = useState(initialQuery?.search ?? '')
  const [pendingSearch, setPendingSearch] = useState(initialQuery?.search ?? '')
  const [status, setStatus] = useState<LibraryTableQuery['status']>(initialQuery?.status ?? 'all')
  const [visibility, setVisibility] = useState<LibraryTableQuery['visibility']>(initialQuery?.visibility ?? 'all')
  const [page, setPage] = useState(initialQuery?.page ?? 1)
  const [data, setData] = useState<LibraryOverviewDto>(initialData)
  const [tableItems, setTableItems] = useState<LibraryTableItem[]>(initialData.table.items)
  const [isLoading, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [noteTarget, setNoteTarget] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('view', view)
    if (search) {
      params.set('filter', search)
    } else {
      params.delete('filter')
    }
    params.set('status', status ?? 'all')
    params.set('visibility', visibility ?? 'all')
    params.set('page', page.toString())
    router.replace(`/admin/library?${params.toString()}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, search, status, visibility, page])

  const fetchData = (
    nextPage = 1,
    options?: { append?: boolean; overrides?: Partial<LibraryTableQuery> },
  ) => {
    startTransition(async () => {
      try {
        const params = new URLSearchParams()
        const nextSearch = options?.overrides?.search ?? search
        const nextStatus = options?.overrides?.status ?? status
        const nextVisibility = options?.overrides?.visibility ?? visibility

        if (nextSearch) params.set('search', nextSearch)
        if (nextStatus && nextStatus !== 'all') params.set('status', nextStatus)
        if (nextVisibility && nextVisibility !== 'all') params.set('visibility', nextVisibility)
        params.set('page', String(nextPage))
        params.set('pageSize', '60')

        const res = await fetch(`/api/admin/library/tasks?${params.toString()}`, { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('failed')
        }
        const payload = (await res.json()) as LibraryOverviewDto
        setData(payload)
        if (options?.append) {
          setTableItems((prev) => [...prev, ...payload.table.items])
        } else {
          setTableItems(payload.table.items)
        }
      } catch (error) {
        toast.error('加载作品库数据失败')
      }
    })
  }

  const handleSearch = () => {
    setPage(1)
    setSearch(pendingSearch)
    fetchData(1, { overrides: { search: pendingSearch } })
    setSelectedIds(new Set())
  }

  const handleStatusChange = (value: LibraryTableQuery['status']) => {
    setStatus(value)
    setPage(1)
    fetchData(1, { overrides: { status: value } })
    setSelectedIds(new Set())
  }

  const handleVisibilityChange = (value: LibraryTableQuery['visibility']) => {
    setVisibility(value)
    setPage(1)
    fetchData(1, { overrides: { visibility: value } })
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === tableItems.length) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(tableItems.map((item) => item.id)))
  }

  const handleBatchAction = async (action: 'make-public' | 'make-private' | 'delete') => {
    if (selectedIds.size === 0) {
      toast('请选择至少一项对象', { icon: 'ℹ️' })
      return
    }
    try {
      const body: Record<string, unknown> = {
        ids: Array.from(selectedIds),
      }
      if (action === 'make-public' || action === 'make-private') {
        body.action = 'visibility'
        body.visibility = action === 'make-public' ? 'PUBLIC' : 'PRIVATE'
      } else if (action === 'delete') {
        body.action = 'delete'
      }
      const res = await fetch('/api/admin/library/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('failed')
      toast.success('批量操作完成')
      setSelectedIds(new Set())
      fetchData(page)
    } catch (error) {
      toast.error('批量操作失败')
    }
  }

  const handleSingleAction = async (id: string, action: 'make-public' | 'make-private' | 'open-note') => {
    if (action === 'open-note') {
      setNoteTarget(id)
      return
    }
    try {
      const res = await fetch('/api/admin/library/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'visibility', ids: [id], visibility: action === 'make-public' ? 'PUBLIC' : 'PRIVATE' }),
      })
      if (!res.ok) throw new Error('failed')
      toast.success('已更新可见性')
      fetchData(page)
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleMove = async (photoId: string, stage: LibraryWorkflowStage) => {
    try {
      const res = await fetch('/api/admin/library/workflow', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, stage }),
      })
      if (!res.ok) throw new Error('failed')
      toast.success('已更新阶段')
      fetchData(page)
    } catch (error) {
      toast.error('更新阶段失败')
    }
  }

  const hasSelection = selectedIds.size > 0

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Heading size="lg">作品库</Heading>
          <Text tone="secondary" size="sm">
            统一管理上传状态、标签与发布流程，支持批量调度与协作备注。
          </Text>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="搜索文件、相册或标签"
              value={pendingSearch}
              onChange={(event) => setPendingSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch()
                }
              }}
              className="w-[220px]"
            />
            <Button variant="secondary" size="sm" onClick={handleSearch}>
              搜索
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={status ?? 'all'}
              onChange={(event) => handleStatusChange(event.target.value as LibraryTableQuery['status'])}
              className="rounded-xl border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
            >
              <option value="all">全部状态</option>
              <option value="processing">处理中</option>
              <option value="review">待审核</option>
              <option value="published">已发布</option>
              <option value="failed">异常</option>
            </select>
            <select
              value={visibility ?? 'all'}
              onChange={(event) => handleVisibilityChange(event.target.value as LibraryTableQuery['visibility'])}
              className="rounded-xl border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
            >
              <option value="all">全部可见性</option>
              <option value="PUBLIC">公开</option>
              <option value="PRIVATE">私密</option>
            </select>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-surface-outline/40 bg-surface-panel/80 p-1">
            <ToggleButton icon={LayoutList} active={view === 'table'} label="表格" onClick={() => setView('table')} />
            <ToggleButton icon={LayoutPanelTop} active={view === 'kanban'} label="看板" onClick={() => setView('kanban')} />
          </div>
        </div>
      </div>

      <LibraryStatsBar stats={data.summary} />

      {hasSelection ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Filter className="h-4 w-4" />
          <span>已选择 {selectedIds.size} 项</span>
          <Button variant="ghost" size="sm" onClick={() => handleBatchAction('make-public')}>
            设为公开
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleBatchAction('make-private')}>
            设为私密
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleBatchAction('delete')}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> 删除
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            清空选择
          </Button>
        </div>
      ) : null}

      {view === 'table' ? (
        <LibraryTable
          items={tableItems}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          onClearSelection={() => setSelectedIds(new Set())}
          onSingleAction={handleSingleAction}
        />
      ) : (
        <LibraryKanban columns={data.workflow} onMove={handleMove} onOpenNote={(id) => setNoteTarget(id)} />
      )}

      {view === 'table' && data.table.hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const nextPage = page + 1
              setPage(nextPage)
              fetchData(nextPage, { append: true })
            }}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCcw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            {isLoading ? '加载中…' : '加载更多'}
          </Button>
        </div>
      ) : null}

      <PhotoNoteDrawer photoId={noteTarget} open={Boolean(noteTarget)} onClose={() => setNoteTarget(null)} />
    </section>
  )
}

interface ToggleButtonProps {
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  label: string
  onClick: () => void
}

function ToggleButton({ icon: Icon, active, label, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition',
        active ? 'bg-primary text-white shadow-subtle' : 'text-text-secondary hover:bg-surface-canvas/60',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
