import type { ReactNode } from 'react'
import { headers } from 'next/headers'

import { AppShell } from '@/components/layout/app-shell'
import { PublicHeader } from '@/components/layout/public-header'
import { AppOverlays } from '@/components/layout/app-overlays'
import { AnalyticsScripts } from '@/components/analytics/analytics-scripts'
import { featureFlags } from '@/lib/config/feature-flags'
import { CSP_NONCE_HEADER } from '@/lib/security-headers'

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const headersList = await headers()
  const nonce = headersList.get(CSP_NONCE_HEADER) ?? undefined
  
  return (
    <>
      <AnalyticsScripts nonce={nonce} />
      <AppShell
        header={<PublicHeader />}
        overlays={featureFlags.enableOverlays ? <AppOverlays /> : undefined}
        contentPadding="none"
        contentClassName="px-0 pb-24 pt-10 md:pt-12 lg:pt-16"
      >
        {children}
      </AppShell>
    </>
  )
}

