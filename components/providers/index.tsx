"use client"

import { ReactNode } from 'react'

import ErrorBoundary from '../error-boundary'
import { AppStateProvider } from './app-state-provider'
import { CommandPaletteProvider } from './command-palette-provider'
import { SWRProvider } from './swr-provider'
import { ThemeSettingsProvider } from './theme-settings-provider'
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
        <SWRProvider>
          <AppStateProvider>{tree}</AppStateProvider>
        </SWRProvider>
      </ThemeSettingsProvider>
    </ErrorBoundary>
  )
}

export default RuntimeProviders

