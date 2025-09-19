'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Sparkles, Search, Loader2, AlertCircle } from 'lucide-react'

interface SemanticSearchPanelProps {
  enabled: boolean
  mode: 'off' | 'shadow' | 'on'
}

interface SemanticResultItem {
  photoId: string
  similarity: number
  width: number | null
  height: number | null
  blurhash?: string | null
  createdAt?: string | null
  imageUrl: string
}

interface SemanticResponse {
  ok: boolean
  items: SemanticResultItem[]
  count: number
  tookMs: number
  model: string
  error?: string
}

const SUGGESTIONS = ['海边 日落', '夜景 城市', '笑容 人像', '森林 清晨', '黑白 艺术']

export function SemanticSearchPanel({ enabled, mode }: SemanticSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SemanticResultItem[]>([])
  const [tookMs, setTookMs] = useState<number | null>(null)
  const [model, setModel] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const disabledReason = useMemo(() => {
    if (!enabled) return '已禁用，请在环境变量中开启 ENABLE_SEMANTIC_SEARCH'
    return null
  }, [enabled])

  async function runSearch(text: string) {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text.trim(), limit: 12 }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(data?.error || `请求失败 (${response.status})`)
      }
      const data = (await response.json()) as SemanticResponse
      setResults(data.items)
      setTookMs(data.tookMs)
      setModel(data.model)
      setQuery(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setResults([])
      setTookMs(null)
    } finally {
      setLoading(false)
    }
  }

  if (disabledReason) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-6">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">语义搜索未启用</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{disabledReason}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <Sparkles className="h-4 w-4" />
              语义搜索 · {model || '未运行'}
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">用自然语言探索照片</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              模式：<span className="font-medium">{mode}</span> · 支持中文/英文描述
            </p>
          </div>
        </div>

        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault()
            const form = event.currentTarget
            const formData = new FormData(form)
            const value = String(formData.get('query') || '')
            runSearch(value)
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                name="query"
                defaultValue={query}
                placeholder="例如：蓝色天空下的现代建筑"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-10 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 搜索中…
                </>
              ) : (
                '立即搜索'
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
          <span>试试：</span>
          {SUGGESTIONS.map((item) => (
            <button
              key={item}
              onClick={() => runSearch(item)}
              className="rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs hover:border-primary hover:text-primary transition"
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {tookMs !== null && !error && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            共找到 <span className="font-semibold">{results.length}</span> 张 · 用时 {tookMs.toFixed(0)} ms
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 p-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="aspect-square rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {results.map((item) => {
              const percent = Math.max(0, Math.min(100, Math.round(((item.similarity + 1) / 2) * 100)))
              return (
                <div key={item.photoId} className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition">
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={item.imageUrl}
                      alt={`Photo ${item.photoId}`}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>#{item.photoId.slice(0, 6)}</span>
                    <span className="font-medium text-primary">{percent}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            输入描述开始搜索，结果会显示在这里。
          </div>
        )}
      </div>
    </div>
  )
}
