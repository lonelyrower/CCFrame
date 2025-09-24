"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Surface } from "@/components/ui/surface"
import toast from "react-hot-toast"

type StorageProviderOption = "local" | "minio" | "aws"

type RuntimeStorageForm = {
  provider: StorageProviderOption
  local: {
    basePath: string
  }
  minio: {
    endpoint: string
    region: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
    cdnUrl: string
    forcePathStyle: boolean
  }
  aws: {
    region: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
    cdnUrl: string
  }
}

type SemanticModeOption = "off" | "shadow" | "on"

type RuntimeSemanticForm = {
  enabled: boolean
  mode: SemanticModeOption
  provider: string
  model: string
  dim: number
  openaiApiKey: string
  openaiBaseUrl: string
}

type RuntimeConfigForm = {
  storage: RuntimeStorageForm
  semantic: RuntimeSemanticForm
}

const STORAGE_OPTIONS: Array<{ value: StorageProviderOption; label: string }> = [
  { value: "local", label: "本地文件系统" },
  { value: "minio", label: "MinIO / S3 兼容" },
  { value: "aws", label: "AWS S3" }
]

const SEMANTIC_PROVIDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "deterministic", label: "内建（无需外部服务）" },
  { value: "openai", label: "OpenAI" }
]

const INITIAL_CONFIG: RuntimeConfigForm = {
  storage: {
    provider: "minio",
    local: { basePath: "" },
    minio: {
      endpoint: "",
      region: "",
      bucket: "",
      accessKeyId: "",
      secretAccessKey: "",
      cdnUrl: "",
      forcePathStyle: true
    },
    aws: {
      region: "",
      bucket: "",
      accessKeyId: "",
      secretAccessKey: "",
      cdnUrl: ""
    }
  },
  semantic: {
    enabled: false,
    mode: "off",
    provider: "deterministic",
    model: "deterministic-v1",
    dim: 768,
    openaiApiKey: "",
    openaiBaseUrl: ""
  }
}

function normalizeNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeConfig(input: any): RuntimeConfigForm {
  return {
    storage: {
      provider: (input?.storage?.provider as StorageProviderOption) || "minio",
      local: { basePath: input?.storage?.local?.basePath || "" },
      minio: {
        endpoint: input?.storage?.minio?.endpoint || "",
        region: input?.storage?.minio?.region || "",
        bucket: input?.storage?.minio?.bucket || "",
        accessKeyId: input?.storage?.minio?.accessKeyId || "",
        secretAccessKey: input?.storage?.minio?.secretAccessKey || "",
        cdnUrl: input?.storage?.minio?.cdnUrl || "",
        forcePathStyle:
          typeof input?.storage?.minio?.forcePathStyle === "boolean"
            ? Boolean(input.storage.minio.forcePathStyle)
            : true
      },
      aws: {
        region: input?.storage?.aws?.region || "",
        bucket: input?.storage?.aws?.bucket || "",
        accessKeyId: input?.storage?.aws?.accessKeyId || "",
        secretAccessKey: input?.storage?.aws?.secretAccessKey || "",
        cdnUrl: input?.storage?.aws?.cdnUrl || ""
      }
    },
    semantic: {
      enabled: Boolean(input?.semantic?.enabled),
      mode: (input?.semantic?.mode || "off") as SemanticModeOption,
      provider: input?.semantic?.provider || "deterministic",
      model: input?.semantic?.model || "deterministic-v1",
      dim: normalizeNumber(input?.semantic?.dim, 768),
      openaiApiKey: input?.semantic?.openaiApiKey || "",
      openaiBaseUrl: input?.semantic?.openaiBaseUrl || ""
    }
  }
}

async function fetchRuntimeConfig(): Promise<RuntimeConfigForm> {
  const response = await fetch("/api/admin/runtime-config")
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error || "加载运行时配置失败")
  }
  const data = await response.json()
  return normalizeConfig(data)
}

async function updateRuntimeConfigPartial(payload: Partial<RuntimeConfigForm>): Promise<RuntimeConfigForm> {
  const response = await fetch("/api/admin/runtime-config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error || "保存失败")
  }
  const data = await response.json()
  return normalizeConfig(data)
}

export default function RuntimeConfigPanel() {
  const [config, setConfig] = useState<RuntimeConfigForm>(INITIAL_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({ storage: false, semantic: false })

  useEffect(() => {
    let mounted = true
    fetchRuntimeConfig()
      .then((data) => {
        if (mounted) setConfig(data)
      })
      .catch((error) => {
        console.error('加载运行时配置失败:', error)
        toast.error(error instanceof Error ? error.message : '加载运行时配置失败')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const handleStorageChange = (updater: (prev: RuntimeStorageForm) => RuntimeStorageForm) => {
    setConfig((prev) => ({ ...prev, storage: updater(prev.storage) }))
  }

  const handleSemanticChange = (updater: (prev: RuntimeSemanticForm) => RuntimeSemanticForm) => {
    setConfig((prev) => ({ ...prev, semantic: updater(prev.semantic) }))
  }

  const saveStorage = async () => {
    setSaving((prev) => ({ ...prev, storage: true }))
    try {
      const updated = await updateRuntimeConfigPartial({ storage: config.storage })
      setConfig(updated)
      toast.success('存储配置已更新')
    } catch (error) {
      console.error('更新存储配置失败:', error)
      toast.error(error instanceof Error ? error.message : '保存存储配置失败')
    } finally {
      setSaving((prev) => ({ ...prev, storage: false }))
    }
  }

  const saveSemantic = async () => {
    setSaving((prev) => ({ ...prev, semantic: true }))
    try {
      const payload: Partial<RuntimeConfigForm> = {
        semantic: {
          ...config.semantic,
          dim: normalizeNumber(config.semantic.dim, 768),
          openaiApiKey: config.semantic.openaiApiKey,
          openaiBaseUrl: config.semantic.openaiBaseUrl,
        }
      }
      const updated = await updateRuntimeConfigPartial(payload)
      setConfig(updated)
      toast.success('语义搜索配置已更新')
    } catch (error) {
      console.error('更新语义配置失败:', error)
      toast.error(error instanceof Error ? error.message : '保存语义配置失败')
    } finally {
      setSaving((prev) => ({ ...prev, semantic: false }))
    }
  }

  return (
    <div className="space-y-8">
      <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-text-primary dark:text-text-inverted">存储提供方设置</h2>
          <p className="text-sm text-text-muted dark:text-text-muted mt-1">选择文件实际存储位置并填写访问凭据。</p>
        </header>
        {loading ? (
          <p className="text-sm text-text-muted dark:text-text-muted">正在加载运行时配置...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">存储模式</label>
              <select
                value={config.storage.provider}
                onChange={(e) => handleStorageChange((prev) => ({
                  ...prev,
                  provider: e.target.value as StorageProviderOption
                }))}
                disabled={saving.storage}
                className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted"
              >
                {STORAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {config.storage.provider === 'local' && (
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">本地文件目录</label>
                <input
                  type="text"
                  value={config.storage.local.basePath}
                  onChange={(e) => handleStorageChange((prev) => ({
                    ...prev,
                    local: { basePath: e.target.value }
                  }))}
                  disabled={saving.storage}
                  placeholder="例如：/var/www/ccframe/uploads"
                  className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted"
                />
              </div>
            )}

            {config.storage.provider === 'minio' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'endpoint', label: 'Endpoint', placeholder: 'https://s3.example.com' },
                  { key: 'region', label: 'Region', placeholder: 'us-east-1' },
                  { key: 'bucket', label: 'Bucket', placeholder: 'ccframe-assets' },
                  { key: 'accessKeyId', label: 'Access Key', placeholder: '' },
                  { key: 'secretAccessKey', label: 'Secret Key', placeholder: '' },
                  { key: 'cdnUrl', label: 'CDN 地址（可选）', placeholder: 'https://cdn.example.com' },
                ].map((field) => (
                  <div key={field.key} className={field.key === 'cdnUrl' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">{field.label}</label>
                    <input
                      type={field.key === 'secretAccessKey' ? 'password' : 'text'}
                      value={(config.storage.minio as any)[field.key] as string}
                      onChange={(e) => handleStorageChange((prev) => ({
                        ...prev,
                        minio: { ...prev.minio, [field.key]: e.target.value }
                      }))}
                      disabled={saving.storage}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted"
                    />
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.storage.minio.forcePathStyle}
                    onChange={(e) => handleStorageChange((prev) => ({
                      ...prev,
                      minio: { ...prev.minio, forcePathStyle: e.target.checked }
                    }))}
                    disabled={saving.storage}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-surface-outline/60 rounded"
                  />
                  <span className="text-sm text-text-secondary dark:text-text-muted">强制使用 Path Style</span>
                </div>
              </div>
            )}

            {config.storage.provider === 'aws' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'region', label: 'Region' },
                  { key: 'bucket', label: 'Bucket' },
                  { key: 'accessKeyId', label: 'Access Key' },
                  { key: 'secretAccessKey', label: 'Secret Key' },
                  { key: 'cdnUrl', label: 'CDN 地址（可选）' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">{field.label}</label>
                    <input
                      type={field.key === 'secretAccessKey' ? 'password' : 'text'}
                      value={(config.storage.aws as any)[field.key] as string}
                      onChange={(e) => handleStorageChange((prev) => ({
                        ...prev,
                        aws: { ...prev.aws, [field.key]: e.target.value }
                      }))}
                      disabled={saving.storage}
                      className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={saveStorage} disabled={saving.storage || loading} className="px-6">
                {saving.storage ? '保存中…' : '保存存储配置'}
              </Button>
            </div>
          </div>
        )}
      </Surface>

      <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-text-primary dark:text-text-inverted">语义搜索</h2>
          <p className="text-sm text-text-muted dark:text-text-muted mt-1">
            启用AI语义搜索，让用户可以用自然语言搜索照片内容。推荐使用OpenAI获得最佳搜索体验。
          </p>
        </header>
        {loading ? (
          <p className="text-sm text-text-muted dark:text-text-muted">正在加载运行时配置...</p>
        ) : (
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.semantic.enabled}
                onChange={(e) => handleSemanticChange((prev) => ({
                  ...prev,
                  enabled: e.target.checked
                }))}
                disabled={saving.semantic}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-surface-outline/60 rounded"
              />
              <span className="text-sm text-text-secondary dark:text-text-muted">启用语义搜索面板</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">运行模式</label>
                <select
                  value={config.semantic.mode}
                  onChange={(e) => handleSemanticChange((prev) => ({
                    ...prev,
                    mode: e.target.value as SemanticModeOption
                  }))}
                  disabled={saving.semantic || !config.semantic.enabled}
                  className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted"
                >
                  <option value="off">关闭</option>
                  <option value="shadow">影子模式（仅生成嵌入）</option>
                  <option value="on">启用检索</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">嵌入提供方</label>
                <select
                  value={config.semantic.provider}
                  onChange={(e) => handleSemanticChange((prev) => ({
                    ...prev,
                    provider: e.target.value
                  }))}
                  disabled={saving.semantic}
                  className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted"
                >
                  {SEMANTIC_PROVIDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-text-muted dark:text-text-muted">
                  {config.semantic.provider === 'openai' && (
                    <span className="text-blue-600 dark:text-blue-400">🚀 推荐：AI理解自然语言，搜索质量最佳</span>
                  )}
                  {config.semantic.provider === 'deterministic' && (
                    <span>🔧 基础：基于文件标签和元数据的快速搜索</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">模型名称</label>
                <input
                  type="text"
                  value={config.semantic.model}
                  onChange={(e) => handleSemanticChange((prev) => ({
                    ...prev,
                    model: e.target.value
                  }))}
                  disabled={saving.semantic}
                  className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">向量维度</label>
                <input
                  type="number"
                  value={config.semantic.dim}
                  onChange={(e) => handleSemanticChange((prev) => ({
                    ...prev,
                    dim: Number(e.target.value) || prev.dim
                  }))}
                  disabled={saving.semantic}
                  min={32}
                  className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">
                  OpenAI API Key
                  {config.semantic.provider === 'openai' && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <input
                  type="password"
                  value={config.semantic.openaiApiKey}
                  onChange={(e) => handleSemanticChange((prev) => ({
                    ...prev,
                    openaiApiKey: e.target.value
                  }))}
                  disabled={saving.semantic || config.semantic.provider !== 'openai'}
                  placeholder={config.semantic.provider === 'openai' ? 'sk-...' : '仅在使用OpenAI时需要'}
                  className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted"
                />
                {config.semantic.provider === 'openai' && !config.semantic.openaiApiKey && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    💡 需要OpenAI API密钥来启用AI语义搜索。没有密钥将使用基础搜索方式。
                  </p>
                )}
                {config.semantic.provider === 'openai' && config.semantic.openaiApiKey && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    ✅ API密钥已配置，将使用AI语义搜索
                  </p>
                )}
                {config.semantic.provider === 'openai' && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>如何获取OpenAI API密钥：</strong>
                    </p>
                    <ol className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                      <li>1. 访问 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a></li>
                      <li>2. 注册或登录OpenAI账户</li>
                      <li>3. 点击&quot;Create new secret key&quot;</li>
                      <li>4. 复制密钥并粘贴到上方输入框</li>
                    </ol>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      💰 成本约$0.005/1000张图片，几乎免费使用
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">OpenAI Base URL</label>
                <input
                  type="text"
                  value={config.semantic.openaiBaseUrl}
                  onChange={(e) => handleSemanticChange((prev) => ({
                    ...prev,
                    openaiBaseUrl: e.target.value
                  }))}
                  disabled={saving.semantic || config.semantic.provider !== 'openai'}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={saveSemantic} disabled={saving.semantic || loading} className="px-6">
                {saving.semantic ? '保存中…' : '保存语义配置'}
              </Button>
            </div>
          </div>
        )}
      </Surface>
    </div>
  )
}
