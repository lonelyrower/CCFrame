"use client"

import { useMemo, useState, useTransition } from 'react'
import toast from 'react-hot-toast'
import { BarChart3, CheckCircle2, Database, FileWarning, Lock, Server, Sparkles, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { SettingsStatusCard } from '@/components/admin/settings-status-card'
import { DangerConfirmModal } from '@/components/admin/danger-confirm-modal'
import type {
  AdminSettingsOverviewDto,
  AnalyticsSettingsDto,
  SettingsValidationResultDto,
  SettingsValidationTarget,
  SiteSettingsDto,
} from '@/types/settings'

interface SettingsWizardProps {
  initialData: AdminSettingsOverviewDto
}

type StepId = 'site' | 'storage' | 'integrations' | 'analytics' | 'semantic' | 'danger'

type WizardStep = {
  id: StepId
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  render: () => JSX.Element
}

export function SettingsWizard({ initialData }: SettingsWizardProps) {
  const [activeStep, setActiveStep] = useState<StepId>('site')
  const [siteSettings, setSiteSettings] = useState(initialData.site)
  const [runtimeStorage, setRuntimeStorage] = useState<Record<string, unknown> | undefined>(initialData.runtime.storage)
  const [runtimeSemantic, setRuntimeSemantic] = useState<Record<string, unknown> | undefined>(initialData.runtime.semantic)
  const [integrations, setIntegrations] = useState(initialData.integrations)
  const [analytics, setAnalytics] = useState(initialData.analytics)
  const [validationResults, setValidationResults] = useState<SettingsValidationResultDto[]>([])
  const [validatingTarget, setValidatingTarget] = useState<SettingsValidationTarget | null>(null)
  const [dangerTarget, setDangerTarget] = useState<null | 'reset-library'> (null)

  const steps: WizardStep[] = useMemo(() => [
    {
      id: 'site',
      title: '站点信息',
      description: '管理站点名称、描述与默认可见性。',
      icon: Users,
      render: () => (
        <SiteSettingsStep
          value={siteSettings}
          onSaved={(next) => {
            setSiteSettings(next)
            toast.success('站点信息已更新')
          }}
        />
      ),
    },
    {
      id: 'storage',
      title: '对象存储',
      description: '配置上传存储位置、访问凭据与 CDN。',
      icon: Server,
      render: () => (
        <StorageSettingsStep
          value={runtimeStorage}
          onSaved={(next) => {
            setRuntimeStorage(next)
            toast.success('存储配置已更新')
          }}
        />
      ),
    },
    {
      id: 'integrations',
      title: '第三方接口',
      description: '维护 Pixabay 等扩展服务的密钥与配额。',
      icon: Database,
      render: () => (
        <IntegrationSettingsStep
          value={integrations}
          onSaved={(next) => {
            setIntegrations(next)
            toast.success('接口配置已更新')
          }}
        />
      ),
    },
    {
      id: 'analytics',
      title: '访问跟踪',
      description: '配置 Google Analytics 和 Microsoft Clarity 等统计服务。',
      icon: BarChart3,
      render: () => (
        <AnalyticsSettingsStep
          value={analytics}
          onSaved={(next) => {
            setAnalytics(next)
            toast.success('访问跟踪配置已更新')
          }}
        />
      ),
    },
    {
      id: 'semantic',
      title: '语义检索',
      description: '调整嵌入模型、维度等参数。',
      icon: Sparkles,
      render: () => (
        <SemanticSettingsStep
          value={runtimeSemantic}
          onSaved={(next) => {
            setRuntimeSemantic(next)
            toast.success('语义配置已更新')
          }}
        />
      ),
    },
    {
      id: 'danger',
      title: '危险操作',
      description: '谨慎执行清理与重置操作。',
      icon: FileWarning,
      render: () => (
        <DangerZoneStep
          onTriggerReset={() => setDangerTarget('reset-library')}
        />
      ),
    },
  ], [siteSettings, runtimeStorage, integrations, analytics, runtimeSemantic])

  const handleValidate = async (target: SettingsValidationTarget) => {
    setValidatingTarget(target)
    try {
      const res = await fetch('/api/admin/settings/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || '校验失败')
      }
      setValidationResults((prev) => [...prev.filter((item) => item.target !== target), payload])
      toast[payload.success ? 'success' : 'error'](payload.message)
    } catch (error) {
      const message = error instanceof Error ? error.message : '校验失败'
      toast.error(message)
      setValidationResults((prev) => [
        ...prev.filter((item) => item.target !== target),
        {
          target,
          success: false,
          message,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setValidatingTarget(null)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_1fr]">
      <nav className="space-y-2">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition',
              activeStep === step.id
                ? 'bg-primary/10 text-primary shadow-soft'
                : 'text-text-secondary hover:bg-surface-panel/70 hover:text-text-primary',
            )}
            onClick={() => setActiveStep(step.id)}
          >
            <step.icon className="h-4 w-4" />
            <span>{step.title}</span>
          </button>
        ))}
      </nav>

      <div className="space-y-6">
        <SettingsStatusCard
          results={validationResults}
          onValidate={handleValidate}
          validatingTarget={validatingTarget}
        />
        <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
          <div>
            <Heading size="sm">{steps.find((step) => step.id === activeStep)?.title}</Heading>
            <Text tone="secondary" size="xs">
              {steps.find((step) => step.id === activeStep)?.description}
            </Text>
          </div>
          {steps.find((step) => step.id === activeStep)?.render()}
        </Surface>
      </div>

      <DangerConfirmModal
        open={dangerTarget === 'reset-library'}
        title="确认重置作品库缓存？"
        description="该操作将清理上传队列缓存并触发重新索引，请确保已经备份数据。"
        confirmLabel="确认重置"
        onClose={() => setDangerTarget(null)}
        onConfirm={() => {
          toast.success('已触发重置流程（模拟）')
        }}
      />
    </div>
  )
}

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

interface SiteSettingsStepProps {
  value: SiteSettingsDto
  onSaved: (value: SiteSettingsDto) => void
}

function SiteSettingsStep({ value, onSaved }: SiteSettingsStepProps) {
  const [form, setForm] = useState<SiteSettingsDto>(value)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/settings/site', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          throw new Error(payload?.error || '更新失败')
        }
        const payload = (await res.json()) as SiteSettingsDto
        onSaved(payload)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '更新失败')
      }
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">站点名称</label>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">默认可见性</label>
          <select
            value={form.defaultVisibility}
            onChange={(event) => setForm((prev) => ({ ...prev, defaultVisibility: event.target.value as 'PUBLIC' | 'PRIVATE' }))}
            className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
          >
            <option value="PUBLIC">公开</option>
            <option value="PRIVATE">私密</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">站点描述</label>
        <textarea
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          className="min-h-[120px] w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={form.allowPublicAccess}
          onChange={(event) => setForm((prev) => ({ ...prev, allowPublicAccess: event.target.checked }))}
          className="h-4 w-4 rounded border-surface-outline/40 text-primary focus:ring-primary"
        />
        允许访客访问公共页面
      </label>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? '保存中…' : '保存设置'}
        </Button>
      </div>
    </form>
  )
}

interface StorageSettingsStepProps {
  value?: Record<string, unknown>
  onSaved: (value: Record<string, unknown>) => void
}

function StorageSettingsStep({ value, onSaved }: StorageSettingsStepProps) {
  const runtime = value ?? {}
  const initialProvider = (runtime.provider as string | undefined) ?? process.env.NEXT_PUBLIC_STORAGE_PROVIDER ?? 'minio'
  const minio = (runtime.minio as Record<string, unknown> | undefined) ?? {}
  const aws = (runtime.aws as Record<string, unknown> | undefined) ?? {}

  const [provider, setProvider] = useState(initialProvider)
  const [endpoint, setEndpoint] = useState((minio.endpoint as string | undefined) ?? (aws.endpoint as string | undefined) ?? '')
  const [region, setRegion] = useState((minio.region as string | undefined) ?? (aws.region as string | undefined) ?? '')
  const [bucket, setBucket] = useState((minio.bucket as string | undefined) ?? (aws.bucket as string | undefined) ?? '')
  const [cdnUrl, setCdnUrl] = useState((minio.cdnUrl as string | undefined) ?? (aws.cdnUrl as string | undefined) ?? '')
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      const targetKey = provider === 'aws' ? 'aws' : 'minio'
      const storageConfig: Record<string, unknown> = {
        provider,
      }
      storageConfig[targetKey] = {
        endpoint: endpoint || undefined,
        region: region || undefined,
        bucket: bucket || undefined,
        cdnUrl: cdnUrl || undefined,
        accessKeyId: accessKeyId || undefined,
        secretAccessKey: secretAccessKey || undefined,
        forcePathStyle: provider === 'minio' ? true : undefined,
      }
      const payload = { storage: storageConfig }

      try {
        const res = await fetch('/api/admin/runtime-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const errorPayload = await res.json().catch(() => null)
          throw new Error(errorPayload?.error || '更新失败')
        }
        const next = await res.json()
        onSaved(next.storage ?? {})
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '更新失败')
      }
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">存储提供商</label>
        <select
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
        >
          <option value="minio">MinIO / 兼容 S3</option>
          <option value="aws">AWS S3</option>
          <option value="local">本地存储</option>
        </select>
      </div>

      {provider !== 'local' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Endpoint">
            <input
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
              placeholder="http://127.0.0.1:9000"
            />
          </Field>
          <Field label="Region">
            <input
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
              placeholder="us-east-1"
            />
          </Field>
          <Field label="Bucket">
            <input
              value={bucket}
              onChange={(event) => setBucket(event.target.value)}
              className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="CDN 域名">
            <input
              value={cdnUrl}
              onChange={(event) => setCdnUrl(event.target.value)}
              className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
              placeholder="https://cdn.example.com"
            />
          </Field>
          <Field label="Access Key">
            <input
              value={accessKeyId}
              onChange={(event) => setAccessKeyId(event.target.value)}
              className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
              placeholder="留空则保持不变"
            />
          </Field>
          <Field label="Secret Key">
            <input
              value={secretAccessKey}
              onChange={(event) => setSecretAccessKey(event.target.value)}
              className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
              placeholder="留空则保持不变"
              type="password"
            />
          </Field>
        </div>
      ) : (
        <Text tone="secondary" size="xs">
          本地存储模式将文件写入服务器本地磁盘，适合开发环境。
        </Text>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? '保存中…' : '保存配置'}
        </Button>
      </div>
    </form>
  )
}

interface FieldProps {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      {children}
    </div>
  )
}

interface IntegrationSettingsStepProps {
  value: { pixabayApiKey: string; defaultSeedCount: number }
  onSaved: (value: { pixabayApiKey: string; defaultSeedCount: number }) => void
}

function IntegrationSettingsStep({ value, onSaved }: IntegrationSettingsStepProps) {
  const [pixabayApiKey, setPixabayApiKey] = useState(value.pixabayApiKey)
  const [defaultSeedCount, setDefaultSeedCount] = useState(value.defaultSeedCount)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/settings/integrations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pixabayApiKey, defaultSeedCount }),
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          throw new Error(payload?.error || '更新失败')
        }
        const payload = await res.json()
        onSaved(payload)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '更新失败')
      }
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field label="Pixabay API Key">
        <input
          value={pixabayApiKey}
          onChange={(event) => setPixabayApiKey(event.target.value)}
          className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
          placeholder="e.g. 12345678-abcdefg"
        />
      </Field>
      <Field label="默认示例图数量">
        <input
          type="number"
          value={defaultSeedCount}
          onChange={(event) => setDefaultSeedCount(Number(event.target.value))}
          className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
          min={1}
          max={99}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? '保存中…' : '保存配置'}
        </Button>
      </div>
    </form>
  )
}

interface SemanticSettingsStepProps {
  value?: Record<string, unknown>
  onSaved: (value: Record<string, unknown>) => void
}

function SemanticSettingsStep({ value, onSaved }: SemanticSettingsStepProps) {
  const semantic = value ?? {}
  const [enabled, setEnabled] = useState(Boolean(semantic.enabled))
  const [mode, setMode] = useState((semantic.mode as string | undefined) ?? 'off')
  const [provider, setProvider] = useState((semantic.provider as string | undefined) ?? 'openai')
  const [model, setModel] = useState((semantic.model as string | undefined) ?? '')
  const [dim, setDim] = useState(Number(semantic.dim ?? 768))
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/runtime-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            semantic: {
              enabled,
              mode,
              provider,
              model,
              dim,
              openaiApiKey: openaiApiKey || undefined,
            },
          }),
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          throw new Error(payload?.error || '更新失败')
        }
        const payload = await res.json()
        onSaved(payload.semantic ?? {})
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '更新失败')
      }
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="h-4 w-4 rounded border-surface-outline/40 text-primary focus:ring-primary"
        />
        启用语义检索功能
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="模式">
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
          >
            <option value="off">关闭</option>
            <option value="shadow">灰度（Shadow）</option>
            <option value="on">启用</option>
          </select>
        </Field>
        <Field label="提供商">
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
          >
            <option value="openai">OpenAI</option>
            <option value="local">自建服务</option>
          </select>
        </Field>
        <Field label="模型名称">
          <input
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
            placeholder="text-embedding-3-small"
          />
        </Field>
        <Field label="向量维度">
          <input
            type="number"
            value={dim}
            onChange={(event) => setDim(Number(event.target.value))}
            className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
            min={32}
            max={4096}
          />
        </Field>
        <Field label="OpenAI Key（可选）">
          <input
            value={openaiApiKey}
            onChange={(event) => setOpenaiApiKey(event.target.value)}
            className="w-full rounded-lg border border-surface-outline/40 bg-surface-panel/80 px-3 py-2 text-sm"
            placeholder="留空保持现有配置"
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? '保存中…' : '保存配置'}
        </Button>
      </div>
    </form>
  )
}

interface AnalyticsSettingsStepProps {
  value: AnalyticsSettingsDto
  onSaved: (value: AnalyticsSettingsDto) => void
}

function AnalyticsSettingsStep({ value, onSaved }: AnalyticsSettingsStepProps) {
  const [form, setForm] = useState<AnalyticsSettingsDto>(value)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/settings/analytics', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          throw new Error(payload?.error || '更新失败')
        }
        const payload = (await res.json()) as AnalyticsSettingsDto
        onSaved(payload)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '更新失败')
      }
    })
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <label className="flex items-center gap-3 text-sm text-white">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))}
          className="h-4 w-4 rounded border-white/20 bg-white/10 text-amber-200 focus:ring-amber-200/50"
        />
        <span className="font-medium">启用访问跟踪</span>
      </label>

      {form.enabled && (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-white/10 bg-white/5 p-4 space-y-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-200" />
              Google Analytics
            </h3>
            <Field label="Google Analytics ID">
              <input
                value={form.googleAnalyticsId || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, googleAnalyticsId: event.target.value }))}
                className="w-full rounded-[12px] border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 backdrop-blur-sm"
                placeholder="G-XXXXXXXXXX"
              />
            </Field>
          </div>

          <div className="rounded-[16px] border border-white/10 bg-white/5 p-4 space-y-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-200" />
              Microsoft Clarity
            </h3>
            <Field label="Microsoft Clarity Project ID">
              <input
                value={form.microsoftClarityId || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, microsoftClarityId: event.target.value }))}
                className="w-full rounded-[12px] border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 backdrop-blur-sm"
                placeholder="abcdefghij"
              />
            </Field>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="rounded-[16px] border border-amber-200/30 bg-amber-100/10 p-4">
          <h3 className="text-sm font-medium text-amber-200 mb-2">使用说明</h3>
          <ul className="text-xs text-white/70 space-y-1">
            <li>• Google Analytics: 在 GA4 中获取以 &quot;G-&quot; 开头的测量 ID</li>
            <li>• Microsoft Clarity: 在 Clarity 项目中获取项目 ID</li>
            <li>• 配置后将在前台页面自动加载跟踪代码</li>
            <li>• 可以同时启用多个跟踪服务</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-[12px] border border-amber-200/30 bg-amber-100/10 text-amber-100 hover:bg-amber-100/20 hover:border-amber-200/50"
        >
          {isPending ? '保存中…' : '保存配置'}
        </Button>
      </div>
    </form>
  )
}

interface DangerZoneStepProps {
  onTriggerReset: () => void
}

function DangerZoneStep({ onTriggerReset }: DangerZoneStepProps) {
  return (
    <div className="space-y-4">
      <Surface tone="canvas" padding="md" className="border border-red-400/40">
        <Heading size="xs" className="text-red-500">
          重置作品库缓存
        </Heading>
        <Text tone="secondary" size="sm" className="mt-2">
          将清理上传队列缓存并触发重新索引。请在维护窗口执行此操作。
        </Text>
        <Button variant="destructive" size="sm" className="mt-3" onClick={onTriggerReset}>
          清空缓存并重建索引
        </Button>
      </Surface>
      <Surface tone="canvas" padding="md" className="border border-surface-outline/40">
        <Heading size="xs">备份建议</Heading>
        <Text tone="secondary" size="sm" className="mt-2">
          在执行危险操作前，请手动导出数据库与存储桶数据，或在 Staging 环境先行验证流程。
        </Text>
      </Surface>
    </div>
  )
}
