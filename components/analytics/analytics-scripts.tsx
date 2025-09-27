'use client'

import { AnalyticsProvider } from './analytics-provider'

export function AnalyticsScripts({ nonce }: { nonce?: string }) {
  // Use default analytics settings for now to avoid server-side fs dependencies
  const analytics = {
    enabled: false,
    googleAnalyticsId: '',
    microsoftClarityId: ''
  }

  return (
    <AnalyticsProvider
      enabled={analytics.enabled}
      googleAnalyticsId={analytics.googleAnalyticsId}
      microsoftClarityId={analytics.microsoftClarityId}
      nonce={nonce}
    />
  )
}