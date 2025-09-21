'use client'

import { ReactNode } from 'react'
import { SWRProvider } from './swr-provider'
import { AppStateProvider } from './app-state-provider'
import ErrorBoundary from '../error-boundary'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <SWRProvider>
        <AppStateProvider>
          {children}
        </AppStateProvider>
      </SWRProvider>
    </ErrorBoundary>
  )
}

export default Providers