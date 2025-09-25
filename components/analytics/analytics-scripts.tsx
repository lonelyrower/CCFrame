import { Suspense } from 'react'
import { getAnalyticsSettings } from '@/lib/admin/settings-service'
import { AnalyticsProvider } from './analytics-provider'

async function AnalyticsContent() {
  const analytics = await getAnalyticsSettings()

  return (
    <AnalyticsProvider
      enabled={analytics.enabled}
      googleAnalyticsId={analytics.googleAnalyticsId}
      microsoftClarityId={analytics.microsoftClarityId}
    />
  )
}

export function AnalyticsScripts() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  )
}