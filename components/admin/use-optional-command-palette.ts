"use client"

import { useCommandPalette } from '@/components/providers/command-palette-provider'

export function useOptionalCommandPalette() {
  try {
    return useCommandPalette()
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('useCommandPalette must be used within a CommandPaletteProvider')) {
        console.warn('[useOptionalCommandPalette] unexpected error', error)
      }
    }
    return null
  }
}
