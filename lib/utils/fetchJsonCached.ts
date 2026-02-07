import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';

type CacheEntry = {
  ts: number;
  value: unknown;
};

const CACHE_PREFIX = 'ccframe:api-cache:v1:';

function readCache(key: string): CacheEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed || typeof parsed.ts !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    const entry: CacheEntry = { ts: Date.now(), value };
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Ignore quota / serialization errors; cache is best-effort.
  }
}

export type FetchJsonCachedResult<T> = {
  data: T;
  source: 'network' | 'cache';
  stale: boolean;
};

export async function fetchJsonCached<T>(
  url: string,
  options: {
    cacheKey?: string;
    ttlMs?: number;
    timeoutMs?: number;
    allowStale?: boolean;
    init?: RequestInit;
  } = {}
): Promise<FetchJsonCachedResult<T>> {
  const {
    cacheKey = url,
    ttlMs = 5 * 60 * 1000,
    timeoutMs = 8000,
    allowStale = true,
    init,
  } = options;

  const storageKey = `${CACHE_PREFIX}${cacheKey}`;
  const cached = readCache(storageKey);
  const ageMs = cached ? Date.now() - cached.ts : Number.POSITIVE_INFINITY;
  const isFresh = ageMs <= ttlMs;
  const canUseCache = Boolean(cached && (isFresh || allowStale));

  // If we're offline, return cache immediately when available.
  if (typeof navigator !== 'undefined' && navigator.onLine === false && canUseCache) {
    return {
      data: cached!.value as T,
      source: 'cache',
      stale: !isFresh,
    };
  }

  // Only cache GETs.
  const method = (init?.method ?? 'GET').toUpperCase();
  const shouldCache = method === 'GET' && typeof window !== 'undefined';

  try {
    const response = await fetchWithTimeout(url, init ?? {}, timeoutMs);

    if (response.ok) {
      const data = (await response.json()) as T;
      if (shouldCache) writeCache(storageKey, data);
      return { data, source: 'network', stale: false };
    }

    // Fallback to cache if server returns an error.
    if (canUseCache) {
      return { data: cached!.value as T, source: 'cache', stale: true };
    }

    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  } catch (error) {
    if (canUseCache) {
      return { data: cached!.value as T, source: 'cache', stale: true };
    }
    throw error;
  }
}

