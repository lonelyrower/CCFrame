"use client"

import { useEffect, useMemo, useState } from 'react'

import { lookbookTemplates } from '@/lib/lookbook/templates'
import type { LookbookExportRecord, LookbookExportResponse } from '@/types/lookbook'
import { cn } from '@/lib/utils'
import { LookbookPreview } from './lookbook-preview'

interface LookbookExportDialogProps {
  open: boolean
  onClose: () => void
  selectedPhotoIds: string[]
}

type DialogState = 'idle' | 'submitting' | 'queued' | 'ready' | 'failed'

export function LookbookExportDialog({ open, onClose, selectedPhotoIds }: LookbookExportDialogProps) {
  const [templateId, setTemplateId] = useState(lookbookTemplates[0]?.id ?? '')
  const [format, setFormat] = useState<'pdf' | 'png'>(lookbookTemplates[0]?.defaultFormat ?? 'pdf')
  const [status, setStatus] = useState<DialogState>('idle')
  const [exportId, setExportId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState<LookbookExportRecord | null>(null)

  const template = useMemo(() => lookbookTemplates.find((item) => item.id === templateId) ?? lookbookTemplates[0], [templateId])

  useEffect(() => {
    if (!template) return
    if (!template.formats.includes(format)) {
      setFormat(template.defaultFormat)
    }
  }, [template, format])

  useEffect(() => {
    if (!open) {
      setStatus('idle')
      setExportId(null)
      setRecord(null)
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!exportId) return
    if (status === 'ready' || status === 'failed') return

    setStatus('queued')
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/lookbook/export/status?id=${exportId}`)
        if (!response.ok) {
          if (response.status === 404) {
            return
          }
          throw new Error('failed to fetch status')
        }
        const payload = (await response.json()) as LookbookExportRecord
        setRecord(payload)
        if (payload.status === 'ready') {
          setStatus('ready')
          clearInterval(interval)
        } else if (payload.status === 'failed') {
          setStatus('failed')
          setError(payload.message ?? '导出失败，请稍后重试')
          clearInterval(interval)
        }
      } catch (pollErr) {
        console.error('[lookbook-export] status poll failed', pollErr)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [exportId, status])

  if (!open) return null
  if (!template) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 text-white">
        <div className="rounded-[40px] border border-white/10 bg-black/60 p-10 text-center backdrop-blur-xl">
          <p>尚未配置 Lookbook 模板。</p>
          <button type="button" onClick={onClose} className="mt-6 rounded-full border border-white/20 px-6 py-2 text-sm uppercase tracking-[0.35em] text-white/60 hover:text-white">
            关闭
          </button>
        </div>
      </div>
    )
  }

  const isSubmitting = status === 'submitting'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (selectedPhotoIds.length === 0) {
      setError('请先选择至少 1 张照片')
      return
    }
    setError(null)
    setStatus('submitting')
    try {
      const response = await fetch('/api/lookbook/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          format,
          photoIds: selectedPhotoIds,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? '导出任务提交失败')
      }
      const payload = (await response.json()) as LookbookExportResponse
      setExportId(payload.exportId)
      setStatus('queued')
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '导出任务提交失败'
      setError(message)
      setStatus('failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 text-white">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[48px] border border-white/10 bg-gradient-to-br from-[#11152c] via-[#0c1124] to-[#080912] p-6 shadow-2xl backdrop-blur-2xl md:p-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/60 transition hover:text-white"
        >
          关闭
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.45em] text-white/50">Lookbook Export</p>
            <h2 className="text-2xl font-semibold text-white">导出 Lookbook</h2>
            <p className="text-sm text-white/60">根据模板快速生成可分享的 Lookbook。导出完成后可在此窗口查看下载链接。</p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">模板</p>
              <div className="space-y-4">
                {lookbookTemplates.map((item) => (
                  <LookbookPreview
                    key={item.id}
                    template={item}
                    selected={item.id === template.id}
                    onSelect={() => setTemplateId(item.id)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-5 rounded-[32px] border border-white/10 bg-black/20 p-6 backdrop-blur-xl">
              <fieldset className="space-y-3" disabled={isSubmitting || status === 'queued' || status === 'ready'}>
                <legend className="text-xs uppercase tracking-[0.35em] text-white/40">导出格式</legend>
                <div className="flex flex-wrap gap-2">
                  {template.formats.map((value) => (
                    <label
                      key={value}
                      className={cn(
                        'cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition',
                        format === value ? 'border-white bg-white/15 text-white' : 'border-white/15 text-white/60 hover:text-white'
                      )}
                    >
                      <input
                        type="radio"
                        name="lookbook-format"
                        value={value}
                        checked={format === value}
                        onChange={() => setFormat(value)}
                        className="hidden"
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs uppercase tracking-[0.35em] text-white/40">
                已选照片：{selectedPhotoIds.length}
              </div>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              {status === 'queued' || status === 'submitting' ? (
                <p className="text-sm text-white/60">正在生成 Lookbook，请稍候…</p>
              ) : null}

              {status === 'ready' && record?.downloadUrl ? (
                <div className="space-y-2 rounded-2xl border border-white/10 bg-emerald-400/10 p-4 text-sm text-white">
                  <p className="font-semibold">导出已完成</p>
                  <a
                    href={record.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70 transition hover:text-white"
                  >
                    下载文件
                  </a>
                  {record.expiresAt ? (
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">有效期至 {new Date(record.expiresAt).toLocaleString()}</p>
                  ) : null}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || status === 'queued'}
                className="w-full rounded-full border border-white/20 bg-white/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition enabled:hover:-translate-y-[1px] enabled:hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'submitting' || status === 'queued' ? '处理中…' : '提交导出'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
