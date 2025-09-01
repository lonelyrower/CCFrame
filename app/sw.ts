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
  ({ request, url }) => {
    return request.destination === 'image' || url.pathname.includes('/api/image/')
  },
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          // Normalize cache keys for image variants
          return request.url
        },
      },
    ],
  })
)

// Cache API calls with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          // Only cache successful responses
          return response.status === 200 ? response : null
        },
      },
    ],
  })
)

// Cache pages with stale-while-revalidate
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages',
  })
)

// Cache static assets (JS, CSS, fonts) with stale-while-revalidate
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
  })
)

// Background sync for failed uploads (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-photos') {
    // Handle offline upload queue
    console.log('Background sync: upload-photos')
  }
})

// Handle offline fallback
self.addEventListener('fetch', (event) => {
  // Serve offline fallback for navigation requests when network fails
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline') || new Response('Offline')
      })
    )
  }
})