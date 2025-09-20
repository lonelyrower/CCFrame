// CC Frame Service Worker
const CACHE_NAME = 'ccframe-v1'
const OFFLINE_URL = '/offline.html'
const CACHE_URLS = [
  '/',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icon.svg'
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_URLS))
      .then(() => console.log('[SW] All resources cached'))
      .catch((error) => console.error('[SW] Cache failed:', error))
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Service worker activated')
      return self.clients.claim()
    })
  )
})

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Offline fallback
          return caches.match(OFFLINE_URL)
        })
    )
    return
  }

  // Handle API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Handle images - cache first, network fallback
  if (request.destination === 'image' || url.pathname.startsWith('/api/image/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) return response

          return fetch(request).then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return response
          })
        })
        .catch(() => caches.match('/icons/icon-192.png'))
    )
    return
  }

  // Handle static assets - cache first
  if (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font' ||
      url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) return response

          return fetch(request).then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return response
          })
        })
    )
    return
  }
})

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Background sync for future use
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered')
  }
})