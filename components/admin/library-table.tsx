"use client"

import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { useMemo } from 'react'
import { Eye, EyeOff, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import type { LibraryTableItem } from '@/types/library'
import { cn } from '@/lib/utils'

interface LibraryTableProps {
  items: LibraryTableItem[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleAll: () => void
  onClearSelection: () => void
  onSingleAction?: (id: string, action: 'make-public' | 'make-private' | 'open-note') => void
}

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function LibraryTable({ items, selectedIds, onToggleSelect, onToggleAll, onClearSelection, onSingleAction }: LibraryTableProps) {
  const headerCheckboxState = useMemo(() => {
    if (items.length === 0) return 'unchecked'
    const selectedCount = items.filter((item) => selectedIds.has(item.id)).length
    if (selectedCount === 0) return 'unchecked'
    if (selectedCount === items.length) return 'checked'
    return 'mixed'
  }, [items, selectedIds])

  return (
    <div className="rounded-2xl border border-surface-outline/40 bg-surface-panel/80 shadow-subtle">
      <div className="flex items-center justify-between border-b border-surface-outline/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            aria-label="选择全部"
            checked={headerCheckboxState === 'checked'}
            ref={(input) => {
              if (input) {
                input.indeterminate = headerCheckboxState === 'mixed'
              }
            }}
            onChange={() => {
              if (headerCheckboxState === 'checked') {
                onClearSelection()
              } else {
                onToggleAll()
              }
            }}
            className="h-4 w-4 rounded border-surface-outline/60 text-primary focus:ring-primary"
          />
          <span>文件</span>
        </div>
        <div className="grid flex-1 grid-cols-[140px_120px_140px_110px] items-center gap-4 pr-2 text-right">
          <span>相册</span>
          <span>标签</span>
          <span>尺寸</span>
          <span>更新</span>
        </div>
      </div>

      <div className="h-[420px]">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={items.length}
              itemSize={72}
              itemData={{ items, selectedIds, onToggleSelect, onSingleAction }}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  )
}

interface RowData {
  items: LibraryTableItem[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSingleAction?: (id: string, action: 'make-public' | 'make-private' | 'open-note') => void
}

function Row({ index, style, data }: ListChildComponentProps<RowData>) {
  const item = data.items[index]
  const selected = data.selectedIds.has(item.id)
  const ratio = `${item.width} × ${item.height}`
  const formattedDate = dateFormatter.format(new Date(item.updatedAt))
  const tagsText = item.tags.map((tag) => tag.name).join(', ')
  const Icon = item.visibility === 'PUBLIC' ? Eye : EyeOff

  return (
    <div
      style={style}
      className={cn(
        'flex items-center border-b border-surface-outline/30 px-4 py-3 text-sm transition',
        selected ? 'bg-primary/5' : 'hover:bg-surface-canvas/60',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => data.onToggleSelect(item.id)}
          className="h-4 w-4 rounded border-surface-outline/60 text-primary focus:ring-primary"
          aria-label={`选择 ${item.fileName}`}
        />
        <div className="min-w-0">
          <Text size="sm" weight="medium" className="truncate text-text-primary">
            {item.title ?? item.fileName}
          </Text>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-outline/30 px-2 py-0.5">
              <Icon className="h-3.5 w-3.5" />
              {item.visibility === 'PUBLIC' ? '公开' : '私密'}
            </span>
            <span>{item.status.toLowerCase()}</span>
            {item.tags.length === 0 ? null : <span className="truncate max-w-[180px]">{tagsText}</span>}
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[140px_120px_140px_110px] items-center gap-4 pr-2 text-right text-xs text-text-secondary">
        <span className="truncate text-left">{item.albumTitle ?? '未归档'}</span>
        <span className="truncate text-left">{item.tags.length > 0 ? `${item.tags.length} 标签` : '—'}</span>
        <span>{ratio}</span>
        <span>{formattedDate}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => data.onSingleAction?.(item.id, item.visibility === 'PUBLIC' ? 'make-private' : 'make-public')}
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">切换可见性</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => data.onSingleAction?.(item.id, 'open-note')}
        >
          <FileText className="h-4 w-4" />
          <span className="sr-only">编辑备注</span>
        </Button>
      </div>
    </div>
  )
}
