"use client"

import { ReactNode } from 'react'

import ErrorBoundary from '../error-boundary'
import { AppStateProvider } from './app-state-provider'
import { CommandPaletteProvider } from './command-palette-provider'
import { PrefetchProvider } from './prefetch-provider'
import { SWRProvider } from './swr-provider'
import { ThemeSettingsProvider } from './theme-settings-provider'
import { PreferenceProvider } from '@/components/context/preference-provider'
import { ObservabilityProvider } from './observability-provider'
import { UploadQueueProvider } from './upload-queue-provider'
import { featureFlags } from '@/lib/config/feature-flags'

interface RuntimeProvidersProps {
  children: ReactNode
}

export function RuntimeProviders({ children }: RuntimeProvidersProps) {
  const tree = featureFlags.enableCommandPalette ? (
    <CommandPaletteProvider>
      <UploadQueueProvider>{children}</UploadQueueProvider>
    </CommandPaletteProvider>
  ) : (
    <UploadQueueProvider>{children}</UploadQueueProvider>
  )

  return (
    <ErrorBoundary>
      <ThemeSettingsProvider>
        <PreferenceProvider>
          <ObservabilityProvider>
            <SWRProvider>
              <PrefetchProvider>
                <AppStateProvider>{tree}</AppStateProvider>
              </PrefetchProvider>
            </SWRProvider>
          </ObservabilityProvider>
        </PreferenceProvider>
      </ThemeSettingsProvider>
    </ErrorBoundary>
  )
}

export default RuntimeProviders
