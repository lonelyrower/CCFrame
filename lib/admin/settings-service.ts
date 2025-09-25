import fs from 'fs'
import path from 'path'

import { db } from '@/lib/db'
import { getRuntimeConfig } from '@/lib/runtime-config'
import { StorageManager } from '@/lib/storage-manager'
import type { StorageProvider } from '@/lib/storage-manager'
import type {
  AdminSettingsOverviewDto,
  AnalyticsSettingsDto,
  IntegrationSettingsDto,
  SettingsValidationResultDto,
  SettingsValidationTarget,
  SiteSettingsDto,
  StorageSettingsOverviewDto,
} from '@/types/settings'
import { recordAdminAlert, recordAdminOperation } from '@/lib/observability/metrics'

const SITE_SETTINGS_PATH = process.env.SITE_SETTINGS_PATH
  ? path.resolve(process.env.SITE_SETTINGS_PATH)
  : path.resolve(process.cwd(), 'config', 'site-settings.json')

const ANALYTICS_SETTINGS_PATH = process.env.ANALYTICS_SETTINGS_PATH
  ? path.resolve(process.env.ANALYTICS_SETTINGS_PATH)
  : path.resolve(process.cwd(), 'config', 'analytics-settings.json')

const defaultSiteSettings: SiteSettingsDto = {
  title: 'CC Frame',
  description: '记录影像与造型的私人云相册。',
  defaultVisibility: 'PUBLIC',
  allowPublicAccess: true,
}

const defaultAnalyticsSettings: AnalyticsSettingsDto = {
  enabled: false,
  googleAnalyticsId: '',
  microsoftClarityId: '',
}

function ensureDirectory(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function readSiteSettingsFile(): SiteSettingsDto {
  try {
    if (!fs.existsSync(SITE_SETTINGS_PATH)) {
      return defaultSiteSettings
    }
    const raw = fs.readFileSync(SITE_SETTINGS_PATH, 'utf8')
    if (!raw.trim()) {
      return defaultSiteSettings
    }
    const parsed = JSON.parse(raw) as Partial<SiteSettingsDto>
    return {
      ...defaultSiteSettings,
      ...parsed,
    }
  } catch (error) {
    console.error('[settings] Failed to read site settings:', error)
    return defaultSiteSettings
  }
}

function writeSiteSettingsFile(settings: SiteSettingsDto) {
  ensureDirectory(SITE_SETTINGS_PATH)
  fs.writeFileSync(SITE_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8')
}

function readAnalyticsSettingsFile(): AnalyticsSettingsDto {
  try {
    if (!fs.existsSync(ANALYTICS_SETTINGS_PATH)) {
      return defaultAnalyticsSettings
    }
    const raw = fs.readFileSync(ANALYTICS_SETTINGS_PATH, 'utf8')
    if (!raw.trim()) {
      return defaultAnalyticsSettings
    }
    const parsed = JSON.parse(raw) as Partial<AnalyticsSettingsDto>
    return {
      ...defaultAnalyticsSettings,
      ...parsed,
    }
  } catch (error) {
    console.error('[settings] Failed to read analytics settings:', error)
    return defaultAnalyticsSettings
  }
}

function writeAnalyticsSettingsFile(settings: AnalyticsSettingsDto) {
  ensureDirectory(ANALYTICS_SETTINGS_PATH)
  fs.writeFileSync(ANALYTICS_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8')
}

export async function getSiteSettings(): Promise<SiteSettingsDto> {
  return readSiteSettingsFile()
}

export async function getAnalyticsSettings(): Promise<AnalyticsSettingsDto> {
  return readAnalyticsSettingsFile()
}

export async function updateSiteSettings(patch: Partial<SiteSettingsDto>): Promise<SiteSettingsDto> {
  const start = Date.now()
  try {
    const current = readSiteSettingsFile()
    const next: SiteSettingsDto = {
      ...current,
      ...patch,
    }
    writeSiteSettingsFile(next)
    recordAdminOperation('settings.site.update', Date.now() - start, 'success', {
      defaultVisibility: next.defaultVisibility,
    })
    return next
  } catch (error) {
    recordAdminOperation('settings.site.update', Date.now() - start, 'error', {
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function updateAnalyticsSettings(patch: Partial<AnalyticsSettingsDto>): Promise<AnalyticsSettingsDto> {
  const start = Date.now()
  try {
    const current = readAnalyticsSettingsFile()
    const next: AnalyticsSettingsDto = {
      ...current,
      ...patch,
    }
    writeAnalyticsSettingsFile(next)
    recordAdminOperation('settings.analytics.update', Date.now() - start, 'success', {
      enabled: next.enabled,
      hasGoogleAnalytics: Boolean(next.googleAnalyticsId),
      hasMicrosoftClarity: Boolean(next.microsoftClarityId),
    })
    return next
  } catch (error) {
    recordAdminOperation('settings.analytics.update', Date.now() - start, 'error', {
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function updateIntegrationSettings(
  userId: string,
  payload: IntegrationSettingsDto,
): Promise<IntegrationSettingsDto> {
  const start = Date.now()
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        pixabayApiKey: payload.pixabayApiKey,
        defaultSeedCount: payload.defaultSeedCount,
      },
    })
    recordAdminOperation('settings.integrations.update', Date.now() - start, 'success', {
      hasPixabayKey: Boolean(payload.pixabayApiKey),
      defaultSeedCount: payload.defaultSeedCount,
    })
    return payload
  } catch (error) {
    recordAdminOperation('settings.integrations.update', Date.now() - start, 'error', {
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function getAdminSettingsOverview(userId: string): Promise<AdminSettingsOverviewDto> {
  const [site, analytics, runtime] = await Promise.all([
    getSiteSettings(),
    getAnalyticsSettings(),
    Promise.resolve(getRuntimeConfig())
  ])

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      pixabayApiKey: true,
      defaultSeedCount: true,
    },
  })

  const storageOverview: StorageSettingsOverviewDto = buildStorageOverview(runtime)

  return {
    account: {
      email: user?.email ?? '',
    },
    site,
    analytics,
    storage: storageOverview,
    integrations: {
      pixabayApiKey: user?.pixabayApiKey ?? '',
      defaultSeedCount: user?.defaultSeedCount ?? 12,
    },
    runtime: {
      storage: runtime.storage,
      semantic: runtime.semantic,
    },
  }
}

export async function validateSettings(
  target: SettingsValidationTarget,
  userId: string,
): Promise<SettingsValidationResultDto> {
  const start = Date.now()
  const result = await performValidation(target, userId)
  recordAdminOperation(`settings.validate.${target}`, Date.now() - start, result.success ? 'success' : 'error', {
    message: result.message,
  })
  if (!result.success) {
    recordAdminAlert(`settings-${target}`, result.message, result.details)
  }
  return result
}

async function performValidation(
  target: SettingsValidationTarget,
  userId: string,
): Promise<SettingsValidationResultDto> {
  switch (target) {
    case 'storage':
      return validateStorage()
    case 'integrations':
      return validateIntegrations(userId)
    case 'semantic':
      return validateSemantic()
    case 'analytics':
      return validateAnalytics()
    default:
      return {
        target,
        success: false,
        message: '未知的校验目标',
        timestamp: new Date().toISOString(),
      }
  }
}

async function validateStorage(): Promise<SettingsValidationResultDto> {
  const runtime = getRuntimeConfig()
  const providerValue = runtime.storage?.provider ?? process.env.STORAGE_PROVIDER ?? 'minio'
  const provider = providerValue.toLowerCase() as StorageProvider

  if (provider === 'local') {
    return {
      target: 'storage',
      success: true,
      message: '当前使用本地存储，无需健康检查。',
      timestamp: new Date().toISOString(),
    }
  }

  try {
    const manager = StorageManager.createFromSettings(provider)
    const health = await manager.healthCheck()
    if (health.ok) {
      return {
        target: 'storage',
        success: true,
        message: '存储桶连通性正常。',
        details: {
          latencyMs: health.latencyMs,
        },
        timestamp: new Date().toISOString(),
      }
    }
    return {
      target: 'storage',
      success: false,
      message: health.error || '无法访问存储桶，请检查凭据或网络配置。',
      details: {
        code: health.code,
        statusCode: health.statusCode,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      target: 'storage',
      success: false,
      message,
      timestamp: new Date().toISOString(),
    }
  }
}

async function validateIntegrations(userId: string): Promise<SettingsValidationResultDto> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      pixabayApiKey: true,
      defaultSeedCount: true,
    },
  })

  if (!user?.pixabayApiKey) {
    return {
      target: 'integrations',
      success: false,
      message: 'Pixabay API Key 未配置。',
      timestamp: new Date().toISOString(),
    }
  }

  if ((user.defaultSeedCount ?? 0) <= 0) {
    return {
      target: 'integrations',
      success: false,
      message: '默认示例图数量需要大于 0。',
      timestamp: new Date().toISOString(),
    }
  }

  return {
    target: 'integrations',
    success: true,
    message: '第三方接口基础配置已就绪。',
    timestamp: new Date().toISOString(),
  }
}

async function validateSemantic(): Promise<SettingsValidationResultDto> {
  const runtime = getRuntimeConfig()
  const semantic = runtime.semantic

  if (!semantic?.enabled) {
    return {
      target: 'semantic',
      success: true,
      message: '语义检索处于关闭状态。',
      timestamp: new Date().toISOString(),
    }
  }

  if (!semantic.model) {
    return {
      target: 'semantic',
      success: false,
      message: '未提供嵌入模型名称。',
      timestamp: new Date().toISOString(),
    }
  }

  if (semantic.provider === 'openai' && !semantic.openaiApiKey && !process.env.OPENAI_API_KEY) {
    return {
      target: 'semantic',
      success: false,
      message: 'OpenAI 模式需要配置 OPENAI_API_KEY。',
      timestamp: new Date().toISOString(),
    }
  }

  return {
    target: 'semantic',
    success: true,
    message: '语义检索配置通过基础校验。',
    timestamp: new Date().toISOString(),
  }
}

async function validateAnalytics(): Promise<SettingsValidationResultDto> {
  const analytics = await getAnalyticsSettings()

  if (!analytics.enabled) {
    return {
      target: 'analytics',
      success: true,
      message: '访问跟踪处于关闭状态。',
      timestamp: new Date().toISOString(),
    }
  }

  const hasGoogleAnalytics = Boolean(analytics.googleAnalyticsId?.trim())
  const hasMicrosoftClarity = Boolean(analytics.microsoftClarityId?.trim())

  if (!hasGoogleAnalytics && !hasMicrosoftClarity) {
    return {
      target: 'analytics',
      success: false,
      message: '访问跟踪已启用但未配置任何跟踪服务。',
      timestamp: new Date().toISOString(),
    }
  }

  const services = []
  if (hasGoogleAnalytics) services.push('Google Analytics')
  if (hasMicrosoftClarity) services.push('Microsoft Clarity')

  return {
    target: 'analytics',
    success: true,
    message: `访问跟踪配置正常，已启用 ${services.join(' 和 ')}。`,
    timestamp: new Date().toISOString(),
  }
}

function buildStorageOverview(runtime: ReturnType<typeof getRuntimeConfig>): StorageSettingsOverviewDto {
  const storage = runtime.storage || {}
  const provider = storage.provider || process.env.STORAGE_PROVIDER || 'minio'
  const source = storage[provider as keyof typeof storage] as Record<string, unknown> | undefined
  return {
    provider,
    bucket:
      (source?.bucket as string | undefined) ??
      process.env.S3_BUCKET_NAME ??
      process.env.AWS_S3_BUCKET ??
      null,
    region:
      (source?.region as string | undefined) ?? process.env.S3_REGION ?? process.env.AWS_REGION ?? null,
    endpoint:
      (source?.endpoint as string | undefined) ??
      process.env.S3_ENDPOINT ??
      process.env.MINIO_ENDPOINT ??
      null,
    cdnUrl: (source?.cdnUrl as string | undefined) ?? process.env.CDN_BASE_URL ?? null,
  }
}
