"use client"

import { useCallback } from 'react'
import { GripVertical, MoveRight, Pencil } from 'lucide-react'

import type { LibraryWorkflowColumn, LibraryWorkflowStage } from '@/types/library'
import { Button } from '@/components/ui/button'
import { Heading, Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

interface LibraryKanbanProps {
  columns: LibraryWorkflowColumn[]
  onMove: (photoId: string, stage: LibraryWorkflowStage) => void
  onOpenNote: (photoId: string) => void
}

export function LibraryKanban({ columns, onMove, onOpenNote }: LibraryKanbanProps) {
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>, columnId: LibraryWorkflowStage) => {
      event.preventDefault()
      const photoId = event.dataTransfer.getData('text/plain')
      if (photoId) {
        onMove(photoId, columnId)
      }
    },
    [onMove],
  )

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex h-full flex-col rounded-2xl border border-surface-outline/40 bg-surface-panel/80 p-4 shadow-subtle"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, column.id)}
        >
          <header className="mb-3 flex items-center justify-between">
            <div>
              <Heading size="sm">{column.title}</Heading>
              <Text size="xs" tone="secondary" className="mt-1">
                {column.description}
              </Text>
            </div>
            <span className="rounded-full bg-surface-outline/40 px-2 py-0.5 text-xs text-text-primary">
              {column.items.length}
            </span>
          </header>

          <div className="flex flex-1 flex-col gap-3 overflow-auto">
            {column.items.length === 0 ? (
              <EmptyHint stage={column.id} />
            ) : (
              column.items.map((item) => (
                <article
                  key={item.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', item.id)
                  }}
                  className="group cursor-grab rounded-xl border border-surface-outline/40 bg-surface-canvas/90 p-3 shadow-subtle active:cursor-grabbing"
                >
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-4 w-4 text-text-muted opacity-0 transition group-hover:opacity-100" />
                    <div className="min-w-0 flex-1">
                      <Heading size="xs" className="truncate text-text-primary">
                        {item.title ?? '未命名作品'}
                      </Heading>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                        <span className="rounded-full bg-surface-outline/40 px-2 py-0.5">
                          {item.visibility === 'PUBLIC' ? '公开' : '私密'}
                        </span>
                        {item.albumTitle ? (
                          <span className="truncate">{item.albumTitle}</span>
                        ) : null}
                        <span>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>

                  <footer className="mt-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      {renderStageActions(column.id, item.id, onMove)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onOpenNote(item.id)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">编辑备注</span>
                    </Button>
                  </footer>
                </article>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function renderStageActions(currentStage: LibraryWorkflowStage, photoId: string, onMove: (photoId: string, stage: LibraryWorkflowStage) => void) {
  const actions: Array<{ stage: LibraryWorkflowStage; label: string }> = []

  if (currentStage !== 'processing') actions.push({ stage: 'processing', label: '回到处理' })
  if (currentStage !== 'review') actions.push({ stage: 'review', label: '待审核' })
  if (currentStage !== 'published') actions.push({ stage: 'published', label: '发布' })
  if (currentStage !== 'failed') actions.push({ stage: 'failed', label: '标记异常' })

  return actions.slice(0, 2).map((action) => (
    <Button
      key={`${photoId}-${action.stage}`}
      variant="ghost"
      size="sm"
      className="h-8 gap-1 text-xs"
      onClick={() => onMove(photoId, action.stage)}
    >
      <MoveRight className="h-3.5 w-3.5" />
      {action.label}
    </Button>
  ))
}

function EmptyHint({ stage }: { stage: LibraryWorkflowStage }) {
  const messages: Record<LibraryWorkflowStage, string> = {
    processing: '上传队列清空，等待新的素材。',
    review: '暂无待审核的作品。',
    published: '还没有发布的作品，尝试从待审核拖拽到此。',
    failed: '最近没有失败的任务。',
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-surface-outline/40 bg-surface-canvas/60 px-4 py-10 text-center text-xs text-text-muted">
      {messages[stage]}
    </div>
  )
}
