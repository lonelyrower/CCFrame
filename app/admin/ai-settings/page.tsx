'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { Key, Eye, EyeOff, Shield } from 'lucide-react'

type AISettings = {
  openaiApiKey: string
  googleApiKey: string
  clipdropApiKey: string
  removeBgApiKey: string
  autoTagEnabled?: boolean
  autoTagIncludeColors?: boolean
  autoTagIncludeContent?: boolean
  autoTagProvider?: 'auto'|'gemini'|'openai'
  autoTagDailyLimit?: number | ''
}

export default function AISettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<AISettings>({
    openaiApiKey: '',
    googleApiKey: '',
    clipdropApiKey: '',
    removeBgApiKey: '',
    autoTagEnabled: false,
    autoTagIncludeColors: true,
    autoTagIncludeContent: true,
    autoTagProvider: 'auto',
    autoTagDailyLimit: ''
  })
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState({ openai: false, google: false, clipdrop: false, removebg: false })

  const load = async () => {
    try {
      const res = await fetch('/api/admin/ai-settings')
      if (!res.ok) return
      const data = await res.json()
      setSettings({
        openaiApiKey: data.openaiApiKey || '',
        googleApiKey: data.googleApiKey || '',
        clipdropApiKey: data.clipdropApiKey || '',
        removeBgApiKey: data.removeBgApiKey || '',
        autoTagEnabled: !!data.autoTagEnabled,
        autoTagIncludeColors: data.autoTagIncludeColors !== false,
        autoTagIncludeContent: data.autoTagIncludeContent !== false,
        autoTagProvider: (data.autoTagProvider || 'auto'),
        autoTagDailyLimit: data.autoTagDailyLimit ?? ''
      })
    } catch (e) {
      console.error('加载AI设置失败:', e)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || '保存失败')
      }
      toast.success('AI设置已保存')
    } catch (e: any) {
      toast.error(e?.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Key className="w-7 h-7 text-blue-600" />
            AI 提供商设置
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            配置 OpenAI / Gemini / Clipdrop / Remove.bg 的 API Key。优先使用此处设置的 Key；未设置则回退到环境变量。
          </p>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            出于安全考虑，建议生产环境通过环境变量管理；此处保存到数据库，仅管理员可访问。
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {/* Auto Tagging */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">自动标签</h2>
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!settings.autoTagEnabled} onChange={(e) => setSettings(s => ({ ...s, autoTagEnabled: e.target.checked }))} /> 启用上传后自动打标签
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={settings.autoTagIncludeColors !== false} onChange={(e) => setSettings(s => ({ ...s, autoTagIncludeColors: e.target.checked }))} /> 颜色标签
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={settings.autoTagIncludeContent !== false} onChange={(e) => setSettings(s => ({ ...s, autoTagIncludeContent: e.target.checked }))} /> 内容标签（需 AI）
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">内容识别提供商</label>
                <select value={settings.autoTagProvider} onChange={(e) => setSettings(s => ({ ...s, autoTagProvider: e.target.value as any }))} className="w-full px-3 py-2 border rounded">
                  <option value="auto">自动（优先 Gemini 再 OpenAI）</option>
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">自动模式按可用 Key 选择；无 Key 则仅打颜色标签。</p>
              </div>
              <div>
                <label className="block text-sm mb-1">每日内容识别上限（次）</label>
                <input type="number" min={0} placeholder="不填或0表示不限" value={settings.autoTagDailyLimit as any} onChange={(e) => setSettings(s => ({ ...s, autoTagDailyLimit: e.target.value ? parseInt(e.target.value) : '' }))} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
          </div>

          {/* OpenAI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">OpenAI API Key</label>
            <div className="relative">
              <input
                type={show.openai ? 'text' : 'password'}
                value={settings.openaiApiKey}
                onChange={(e) => setSettings((s) => ({ ...s, openaiApiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShow((v) => ({ ...v, openai: !v.openai }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {show.openai ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">用于未来的 OpenAI 图像编辑功能（当前未实现具体编辑）。</p>
          </div>

          {/* Google Gemini */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Google Gemini API Key</label>
            <div className="relative">
              <input
                type={show.google ? 'text' : 'password'}
                value={settings.googleApiKey}
                onChange={(e) => setSettings((s) => ({ ...s, googleApiKey: e.target.value }))}
                placeholder="AIza..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShow((v) => ({ ...v, google: !v.google }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {show.google ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">用于 AI增强/风格转换 的建议分析（无 Key 时回退本地增强）。</p>
          </div>

          {/* Clipdrop */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Clipdrop API Key</label>
            <div className="relative">
              <input
                type={show.clipdrop ? 'text' : 'password'}
                value={settings.clipdropApiKey}
                onChange={(e) => setSettings((s) => ({ ...s, clipdropApiKey: e.target.value }))}
                placeholder="clipdrop_..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShow((v) => ({ ...v, clipdrop: !v.clipdrop }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {show.clipdrop ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">启用 真·AI放大 与 真·去背景 功能。</p>
          </div>

          {/* Remove.bg */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remove.bg API Key</label>
            <div className="relative">
              <input
                type={show.removebg ? 'text' : 'password'}
                value={settings.removeBgApiKey}
                onChange={(e) => setSettings((s) => ({ ...s, removeBgApiKey: e.target.value }))}
                placeholder="rm_..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShow((v) => ({ ...v, removebg: !v.removebg }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {show.removebg ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">作为去背景备选；若同时配置，与 Clipdrop 比较后优先 Clipdrop。</p>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={loading} className="px-6">
              {loading ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
