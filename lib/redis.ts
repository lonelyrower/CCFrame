import { Redis } from 'ioredis'

type RedisGlobalState = {
  clientPromise?: Promise<Redis | null>
  warned?: boolean
}

const globalState = globalThis as unknown as RedisGlobalState

function warnOnce(message: string, err?: unknown) {
  if (globalState.warned) return
  globalState.warned = true
  const detail = err instanceof Error ? err.message : err ? String(err) : ''
  const suffix = detail ? `: ${detail}` : ''
  const note = `${message}${suffix}`
  if (process.env.NODE_ENV === 'production') {
    console.error(`[redis] ${note}`)
  } else {
    console.warn(`[redis] ${note}`)
  }
}

async function createRedisClient(): Promise<Redis | null> {
  const url = process.env.REDIS_URL
  if (!url) {
    return null
  }

  try {
    const client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      reconnectOnError: () => false,
    })

    client.on('error', (err) => {
      warnOnce('无法连接 Redis，已回退到内存缓存', err)
    })

    client.on('end', () => {
      globalState.clientPromise = undefined
    })

    await client.connect()
    return client
  } catch (err) {
    warnOnce('初始化 Redis 客户端失败，已回退到内存缓存', err)
    return null
  }
}

export async function getRedis(): Promise<Redis | null> {
  if (!process.env.REDIS_URL) {
    return null
  }

  if (!globalState.clientPromise) {
    globalState.clientPromise = createRedisClient()
  }

  const client = await globalState.clientPromise
  if (!client) {
    globalState.clientPromise = undefined
    return null
  }

  let status = client.status

  if (status === 'wait' || status === 'connecting') {
    try {
      await client.connect()
      status = client.status
    } catch (err) {
      warnOnce('Redis 连接失败，已回退到内存缓存', err)
      globalState.clientPromise = undefined
      return null
    }
  }

  if (status === 'ready' || status === 'connect') {
    return client
  }

  return null
}
