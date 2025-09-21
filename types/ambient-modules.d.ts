// AI provider modules no longer used

declare module 'workbox-precaching' {
  export const precacheAndRoute: any
  export const cleanupOutdatedCaches: any
}

declare module 'workbox-routing' {
  export const registerRoute: any
}

declare module 'workbox-strategies' {
  export const CacheFirst: any
  export const NetworkFirst: any
  export const StaleWhileRevalidate: any
}

declare module 'otplib' {
  export const authenticator: {
    generate(secret?: string): string
    generateSecret(): string
    verify(options: { token: string; secret: string }): boolean
    keyuri(account: string, issuer: string, secret: string): string
  }
}

declare module 'qrcode' {
  export function toDataURL(text: string): Promise<string>
}
