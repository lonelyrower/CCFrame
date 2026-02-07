const CACHE_VERSION = 'ccframe-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const MAX_STATIC_ENTRIES = 64;
const MAX_RUNTIME_ENTRIES = 256;

const PRECACHE_URLS = [
  '/',
  '/?source=pwa',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo.svg',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/photos.png',
  '/icons/admin.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Be resilient: cache what we can, even if some URLs fail.
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

const trimCache = async (cacheName, maxEntries) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const extra = keys.length - maxEntries;
  await Promise.all(keys.slice(0, extra).map((request) => cache.delete(request)));
};

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
    trimCache(cacheName, cacheName === STATIC_CACHE ? MAX_STATIC_ENTRIES : MAX_RUNTIME_ENTRIES).catch(() => {});
  }
  return response;
};

const networkFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      trimCache(cacheName, MAX_RUNTIME_ENTRIES).catch(() => {});
      return response;
    }

    // Don't cache error responses; fall back to the last good cached version if we have one.
    const cached = await cache.match(request);
    if (cached) return cached;
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return cache.match('/offline.html');
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  if (['style', 'script', 'font', 'image'].includes(request.destination)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
  }
});
