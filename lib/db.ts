import { PrismaClient } from '@prisma/client'

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL)

export class DatabaseNotConfiguredError extends Error {
  constructor(message = 'DATABASE_URL is not configured. Database access is disabled.') {
    super(message)
    this.name = 'DatabaseNotConfiguredError'
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createMissingDatabaseProxy(): PrismaClient {
  const warned = new Set<string>()
  const shouldWarn = process.env.NODE_ENV === 'development'

  const warn = (operation: string) => {
    if (!shouldWarn || warned.has(operation)) return
    warned.add(operation)
    console.warn(`[database] Skipped ${operation} because DATABASE_URL is not configured.`)
  }

  const makeAsyncValue = <T>(operation: string, value: T) => async () => {
    warn(operation)
    return value
  }

  const makeAsyncError = (operation: string) => async () => {
    warn(operation)
    throw new DatabaseNotConfiguredError()
  }

  const modelHandler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined
      switch (prop) {
        case 'findMany':
        case 'groupBy':
          return makeAsyncValue(prop, [])
        case 'count':
          return makeAsyncValue(prop, 0)
        case 'aggregate':
          return makeAsyncValue(prop, {})
        case 'findUnique':
        case 'findFirst':
          return makeAsyncValue(prop, null)
        case 'findUniqueOrThrow':
        case 'findFirstOrThrow':
        case 'create':
        case 'createMany':
        case 'update':
        case 'updateMany':
        case 'delete':
        case 'deleteMany':
        case 'upsert':
          return makeAsyncError(prop)
        case 'findRaw':
          return makeAsyncValue(prop, [])
        case 'aggregateRaw':
          return makeAsyncValue(prop, [])
        default:
          return makeAsyncError(prop)
      }
    }
  }

  const clientHandler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === 'then') return undefined
      if (typeof prop !== 'string') return undefined

      switch (prop) {
        case '$queryRaw':
        case '$queryRawUnsafe':
          return makeAsyncValue(prop, [])
        case '$executeRaw':
        case '$executeRawUnsafe':
          return makeAsyncValue(prop, 0)
        case '$transaction':
        case '$extends':
        case '$on':
        case '$use':
        case '$disconnect':
        case '$connect':
          return makeAsyncError(prop)
        default:
          return new Proxy({}, modelHandler)
      }
    }
  }

  return new Proxy({}, clientHandler) as unknown as PrismaClient
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : []
  })
}

let dbClient: PrismaClient

try {
  dbClient = isDatabaseConfigured
    ? globalForPrisma.prisma ?? createPrismaClient()
    : createMissingDatabaseProxy()

  if (!isDatabaseConfigured && process.env.NODE_ENV === 'development') {
    console.warn('[database] DATABASE_URL is not configured. Public pages fall back to placeholder data.')
  }

  if (process.env.NODE_ENV !== 'production' && isDatabaseConfigured) {
    globalForPrisma.prisma = dbClient
  }
} catch (error) {
  console.error('[database] Failed to initialize database client:', error)
  // 在生产环境中，如果数据库初始化失败，使用代理
  dbClient = createMissingDatabaseProxy()
}

export const db = dbClient

