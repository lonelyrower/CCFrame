"use client"

import { useEffect, useState, useTransition } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Heading, Text } from '@/components/ui/typography'
import { Surface } from '@/components/ui/surface'

interface PhotoNoteDrawerProps {
  photoId: string | null
  open: boolean
  onClose: () => void
}

interface NotePayload {
  note: string
  updatedAt: string
}

export function PhotoNoteDrawer({ photoId, open, onClose }: PhotoNoteDrawerProps) {
  const [note, setNote] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open || !photoId) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/library/notes/${photoId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('failed')
        const data = (await res.json()) as NotePayload
        if (!cancelled) {
          setNote(data.note ?? '')
          setUpdatedAt(data.updatedAt)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error('加载备注失败')
          setNote('')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, photoId])

  const handleSave = () => {
    if (!photoId) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/library/notes/${photoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ note }),
        })
        if (!res.ok) {
          throw new Error('failed')
        }
        const data = (await res.json()) as NotePayload
        setUpdatedAt(data.updatedAt)
        toast.success('备注已保存')
        onClose()
      } catch (error) {
        toast.error('保存失败，请稍后再试')
      }
    })
  }

  if (!open || !photoId) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-surface-outline/20 backdrop-blur-sm" role="dialog" aria-modal>
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <Surface
        tone="panel"
        padding="lg"
        className="relative z-[130] flex h-full w-full max-w-md flex-col gap-4 shadow-floating"
      >
        <header className="space-y-1">
          <Heading size="sm">作品备注</Heading>
          <Text size="xs" tone="secondary">
            {updatedAt ? `上次更新：${new Date(updatedAt).toLocaleString('zh-CN')}` : '填写内部备注用于协同'}
          </Text>
        </header>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="h-full min-h-[240px] flex-1 resize-none rounded-xl border border-surface-outline/40 bg-surface-canvas/80 p-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="记录调色、审核或客户反馈等信息"
        />

        <footer className="flex justify-between">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? '保存中…' : '保存备注'}
          </Button>
        </footer>
      </Surface>
    </div>
  )
}
