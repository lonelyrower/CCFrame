import type { ReactNode } from 'react'

import { AppShell } from '@/components/layout/app-shell'
import { PublicHeader } from '@/components/layout/public-header'
import { AppOverlays } from '@/components/layout/app-overlays'
import { featureFlags } from '@/lib/config/feature-flags'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      header={<PublicHeader />}
      overlays={featureFlags.enableOverlays ? <AppOverlays /> : undefined}
      contentPadding="none"
      contentClassName="px-0 pb-24 pt-10 md:pt-12 lg:pt-16"
    >
      {children}
    </AppShell>
  )
}

