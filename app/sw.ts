/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope & typeof globalThis
declare const __WB_MANIFEST: Array<{ url: string; revision?: string }>

// Clean up old caches
cleanupOutdatedCaches()

// Precache static assets
precacheAndRoute(__WB_MANIFEST || [])

// Cache images with cache-first strategy
registerRoute(
  ({ request, url }: any) => {
    return request.destination === 'image' || url.pathname.includes('/api/image/')
  },
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }: any) => {
          // Normalize cache keys for image variants
          return request.url
        },
      },
    ],
  })
)

// Cache API calls with network-first strategy
registerRoute(
  ({ url }: any) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheWillUpdate: async ({ response }: any) => {
          // Only cache successful responses
          return response.status === 200 ? response : null
        },
      },
    ],
  })
)

// Cache pages with stale-while-revalidate
registerRoute(
  ({ request }: any) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages',
  })
)

// Cache static assets (JS, CSS, fonts) with stale-while-revalidate
registerRoute(
  ({ request }: any) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
  })
)

// Background sync for failed uploads (future enhancement)
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'upload-photos') {
    // Handle offline upload queue
    console.log('Background sync: upload-photos')
  }
})

// Note: Additional fetch handling is managed by workbox strategies above
