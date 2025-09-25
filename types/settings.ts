export type SiteSettingsDto = {
  title: string
  description: string
  defaultVisibility: 'PUBLIC' | 'PRIVATE'
  allowPublicAccess: boolean
}

export type StorageSettingsOverviewDto = {
  provider: string
  bucket?: string | null
  region?: string | null
  endpoint?: string | null
  cdnUrl?: string | null
}

export type IntegrationSettingsDto = {
  pixabayApiKey: string
  defaultSeedCount: number
}

export type AnalyticsSettingsDto = {
  googleAnalyticsId?: string
  microsoftClarityId?: string
  enabled: boolean
}

export type SemanticSettingsOverviewDto = {
  enabled: boolean
  mode: 'off' | 'shadow' | 'on'
  provider?: string
  model?: string
  dim?: number
}

export type AdminSettingsOverviewDto = {
  account: {
    email: string
  }
  site: SiteSettingsDto
  storage: StorageSettingsOverviewDto
  integrations: IntegrationSettingsDto
  analytics: AnalyticsSettingsDto
  runtime: {
    storage?: Record<string, unknown>
    semantic?: Record<string, unknown>
  }
}

export type SettingsValidationTarget = 'storage' | 'integrations' | 'semantic' | 'analytics'

export type SettingsValidationResultDto = {
  target: SettingsValidationTarget
  success: boolean
  message: string
  details?: Record<string, unknown>
  timestamp: string
}
