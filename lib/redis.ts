import { Redis } from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis = (() => {
  if (!process.env.REDIS_URL) {
    return null
  }

  if (globalForRedis.redis) {
    return globalForRedis.redis
  }

  const redisInstance = new Redis(process.env.REDIS_URL)

  if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redisInstance
  }

  return redisInstance
})() as Redis | null