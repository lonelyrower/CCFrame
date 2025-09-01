declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string)
    getGenerativeModel(opts: { model: string }): any
  }
}

declare module 'openai' {
  const OpenAI: any
  export default OpenAI
}

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

