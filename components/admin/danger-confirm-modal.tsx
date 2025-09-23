"use client"

import { useCallback } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'

interface DangerConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onClose: () => void
  onConfirm: () => void
}

export function DangerConfirmModal({ open, title, description, confirmLabel = '确认操作', onClose, onConfirm }: DangerConfirmModalProps) {
  const handleConfirm = useCallback(() => {
    onConfirm()
    onClose()
  }, [onConfirm, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-surface-outline/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <Surface tone="panel" padding="lg" className="relative z-[210] w-full max-w-md space-y-4 border border-red-500/40 shadow-floating">
        <button
          type="button"
          aria-label="关闭"
          onClick={onClose}
          className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
        <Heading size="sm" className="text-red-500">
          {title}
        </Heading>
        <Text tone="secondary" size="sm">
          {description}
        </Text>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </Surface>
    </div>
  )
}
