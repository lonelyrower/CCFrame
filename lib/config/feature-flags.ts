import { env } from 'process'

const truthy = ['1', 'true', 'on', 'yes']

function readBoolean(key: string, fallback: boolean) {
  const value = env[key]
  if (value === undefined) return fallback
  return truthy.includes(value.toLowerCase())
}

export const featureFlags = {
  enableOverlays: readBoolean('NEXT_PUBLIC_ENABLE_APP_OVERLAYS', true),
  enableCommandPalette: readBoolean('NEXT_PUBLIC_ENABLE_COMMAND_PALETTE', true),
  enableSmoothScroll: readBoolean('NEXT_PUBLIC_ENABLE_SMOOTH_SCROLL', true),
}

export type FeatureFlagKey = keyof typeof featureFlags

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return featureFlags[flag]
}
