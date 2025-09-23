const pendingPrefetches = new Set<string>()

type IdleCallbackWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
}

interface PrefetchOptions {
  immediate?: boolean
}

function postToServiceWorker(urls: string[]) {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false

  const controller = navigator.serviceWorker.controller
  if (!controller) return false

  controller.postMessage({ type: 'PREFETCH_URLS', urls })
  return true
}

async function fallbackFetch(url: string) {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      mode: 'cors',
      cache: 'force-cache',
    })
    if (!response.ok) {
      throw new Error(`Prefetch failed: ${response.status}`)
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[prefetcher] failed to prefetch', url, error)
    }
  }
}

export function queuePrefetch(urls: string[] | string, options: PrefetchOptions = {}) {
  const list = Array.isArray(urls) ? urls : [urls]

  const toPrefetch = list.filter((url) => {
    if (!url || pendingPrefetches.has(url)) return false
    pendingPrefetches.add(url)
    return true
  })

  if (!toPrefetch.length) return

  const dispatch = () => {
    if (!postToServiceWorker(toPrefetch)) {
      void Promise.all(toPrefetch.map(fallbackFetch))
    }
  }

  if (options.immediate) {
    dispatch()
    return
  }

  if (typeof window === 'undefined') {
    dispatch()
    return
  }

  const win = window as IdleCallbackWindow

  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(dispatch, { timeout: 2000 })
  } else {
    win.setTimeout(dispatch, 100)
  }
}

export function resetPrefetchRegistry() {
  pendingPrefetches.clear()
}
