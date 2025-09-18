#!/usr/bin/env tsx
import { loadEnvConfig } from '@next/env'
import { db } from '@/lib/db'
import { StorageManager, type StorageConfig, type StorageProvider } from '@/lib/storage-manager'
import { HeadBucketCommand } from '@aws-sdk/client-s3'
import Redis from 'ioredis'
import { promises as fs } from 'fs'
import path from 'path'

loadEnvConfig(process.cwd())

type Status = 'ok' | 'warn' | 'error'
type EnvGroup = 'core' | 'auth' | 'redis' | 'storage' | 'optional'

interface EnvResult {
  key: string
  group: EnvGroup
  status: Status
  detail?: string
  value?: string
}

interface ServiceResult {
  name: string
  status: Status
  latencyMs?: number
  detail?: string
}

const args = new Set(process.argv.slice(2))
const outputJson = args.has('--json')
const strictMode = args.has('--strict')

function isStorageProvider(value: string): value is StorageProvider {
  return value === 'minio' || value === 'aws' || value === 'aliyun' || value === 'qcloud'
}

function checkEnvVars(): { results: EnvResult[]; provider: 'local' | StorageProvider } {
  const results: EnvResult[] = []

  const push = (params: {
    key: string
    group: EnvGroup
    required?: boolean
    presentDetail?: string
    missingDetail?: string
    exposeValue?: boolean
  }) => {
    const raw = (process.env[params.key] ?? '').trim()
    const required = params.required ?? false
    const status: Status = raw ? 'ok' : (required ? 'error' : 'warn')
    results.push({
      key: params.key,
      group: params.group,
      status,
      detail: raw ? params.presentDetail : (params.missingDetail || (required ? 'Required environment variable not set' : 'Optional environment variable not set')),
      value: raw ? (params.exposeValue ? raw : 'present') : undefined,
    })
    return raw
  }

  push({
    key: 'DATABASE_URL',
    group: 'core',
    required: true,
    missingDetail: 'Set DATABASE_URL to your Postgres connection string',
  })

  push({
    key: 'NEXTAUTH_SECRET',
    group: 'auth',
    required: true,
    missingDetail: 'Run `openssl rand -base64 32` and set NEXTAUTH_SECRET',
  })

  push({
    key: 'NEXTAUTH_URL',
    group: 'auth',
    presentDetail: 'NextAuth public URL set',
    missingDetail: 'Recommended in production for correct callback URLs',
    exposeValue: true,
  })

  push({
    key: 'ADMIN_EMAIL',
    group: 'auth',
    presentDetail: 'Admin seed email configured',
    missingDetail: 'Optional but enables default admin seed',
    exposeValue: true,
  })

  push({
    key: 'ADMIN_PASSWORD',
    group: 'auth',
    presentDetail: 'Admin seed password configured',
    missingDetail: 'Optional but enables default admin seed',
  })

  push({
    key: 'REDIS_URL',
    group: 'redis',
    presentDetail: 'Redis URL configured',
    missingDetail: 'Redis required for queues, caching, and rate limits',
  })

  const providerRaw = push({
    key: 'STORAGE_PROVIDER',
    group: 'storage',
    presentDetail: 'Configured storage provider',
    missingDetail: 'STORAGE_PROVIDER not set, defaulting to "minio"',
    exposeValue: true,
  })

  const normalizedProvider = (providerRaw || 'minio').toLowerCase()

  if (normalizedProvider === 'local') {
    return { results, provider: 'local' }
  }

  const provider: StorageProvider = isStorageProvider(normalizedProvider) ? normalizedProvider : 'minio'

  if (!isStorageProvider(normalizedProvider) && normalizedProvider !== 'minio') {
    results.push({
      key: 'STORAGE_PROVIDER_VALUE',
      group: 'storage',
      status: 'warn',
      detail: `Unknown storage provider "${normalizedProvider}", will treat as "minio"`,
      value: normalizedProvider,
    })
  }

  const pushBucket = (key: string, label: string) =>
    push({
      key,
      group: 'storage',
      required: true,
      presentDetail: `${label} configured`,
      missingDetail: `${label} is required`,
      exposeValue: true,
    })

  if (provider === 'minio') {
    pushBucket('S3_BUCKET_NAME', 'MinIO/S3 bucket')
    const usingDefaultKey = !((process.env.S3_ACCESS_KEY_ID ?? '').trim() || (process.env.MINIO_ROOT_USER ?? '').trim())
    results.push({
      key: 'MINIO_ACCESS_KEY_SOURCE',
      group: 'storage',
      status: usingDefaultKey ? 'warn' : 'ok',
      detail: usingDefaultKey ? 'Using default minioadmin access key' : 'Custom access key configured',
      value: usingDefaultKey ? 'default(minioadmin)' : (process.env.S3_ACCESS_KEY_ID ? 'S3_ACCESS_KEY_ID' : 'MINIO_ROOT_USER'),
    })

    const usingDefaultSecret = !((process.env.S3_SECRET_ACCESS_KEY ?? '').trim() || (process.env.MINIO_ROOT_PASSWORD ?? '').trim())
    results.push({
      key: 'MINIO_SECRET_KEY_SOURCE',
      group: 'storage',
      status: usingDefaultSecret ? 'warn' : 'ok',
      detail: usingDefaultSecret ? 'Using default minioadmin secret' : 'Custom secret configured',
      value: usingDefaultSecret ? 'default(minioadmin)' : (process.env.S3_SECRET_ACCESS_KEY ? 'S3_SECRET_ACCESS_KEY' : 'MINIO_ROOT_PASSWORD'),
    })
  } else if (provider === 'aws') {
    pushBucket('AWS_S3_BUCKET', 'AWS S3 bucket')
    push({
      key: 'AWS_REGION',
      group: 'storage',
      required: true,
      presentDetail: 'AWS region configured',
      missingDetail: 'AWS_REGION is required',
      exposeValue: true,
    })
    push({
      key: 'AWS_ACCESS_KEY_ID',
      group: 'storage',
      required: true,
      presentDetail: 'AWS access key configured',
      missingDetail: 'AWS_ACCESS_KEY_ID is required',
    })
    push({
      key: 'AWS_SECRET_ACCESS_KEY',
      group: 'storage',
      required: true,
      presentDetail: 'AWS secret configured',
      missingDetail: 'AWS_SECRET_ACCESS_KEY is required',
    })
  } else if (provider === 'aliyun') {
    pushBucket('ALIYUN_OSS_BUCKET', 'Aliyun OSS bucket')
    push({
      key: 'ALIYUN_REGION',
      group: 'storage',
      required: true,
      presentDetail: 'Aliyun region configured',
      missingDetail: 'ALIYUN_REGION is required',
      exposeValue: true,
    })
    push({
      key: 'ALIYUN_ACCESS_KEY_ID',
      group: 'storage',
      required: true,
      presentDetail: 'Aliyun access key configured',
      missingDetail: 'ALIYUN_ACCESS_KEY_ID is required',
    })
    push({
      key: 'ALIYUN_SECRET_ACCESS_KEY',
      group: 'storage',
      required: true,
      presentDetail: 'Aliyun secret configured',
      missingDetail: 'ALIYUN_SECRET_ACCESS_KEY is required',
    })
  } else if (provider === 'qcloud') {
    pushBucket('QCLOUD_COS_BUCKET', 'Tencent COS bucket')
    push({
      key: 'QCLOUD_REGION',
      group: 'storage',
      required: true,
      presentDetail: 'Tencent region configured',
      missingDetail: 'QCLOUD_REGION is required',
      exposeValue: true,
    })
    push({
      key: 'QCLOUD_SECRET_ID',
      group: 'storage',
      required: true,
      presentDetail: 'Tencent secret id configured',
      missingDetail: 'QCLOUD_SECRET_ID is required',
    })
    push({
      key: 'QCLOUD_SECRET_KEY',
      group: 'storage',
      required: true,
      presentDetail: 'Tencent secret key configured',
      missingDetail: 'QCLOUD_SECRET_KEY is required',
    })
  }

  return { results, provider }
}

function envResultFor(results: EnvResult[], key: string): EnvResult | undefined {
  return results.find(r => r.key === key)
}

async function checkDatabase(envResults: EnvResult[]): Promise<ServiceResult> {
  const dbEnv = envResultFor(envResults, 'DATABASE_URL')
  if (dbEnv && dbEnv.status === 'error') {
    return { name: 'database', status: 'error', detail: dbEnv.detail }
  }
  const start = Date.now()
  try {
    await db.$queryRaw`SELECT 1`
    return { name: 'database', status: 'ok', latencyMs: Date.now() - start, detail: 'Connected to database' }
  } catch (err) {
    return { name: 'database', status: 'error', detail: (err as Error).message }
  }
}

async function checkRedis(envResults: EnvResult[]): Promise<ServiceResult> {
  const redisEnv = envResultFor(envResults, 'REDIS_URL')
  const redisUrl = (process.env.REDIS_URL ?? '').trim()
  if (!redisUrl) {
    return {
      name: 'redis',
      status: redisEnv && redisEnv.status === 'error' ? 'error' : 'warn',
      detail: 'REDIS_URL not set – queues, caching, and rate limits will be disabled',
    }
  }
  const client = new Redis(redisUrl, { lazyConnect: true })
  try {
    const start = Date.now()
    await client.connect()
    await client.ping()
    await client.quit()
    return { name: 'redis', status: 'ok', latencyMs: Date.now() - start, detail: 'Ping succeeded' }
  } catch (err) {
    client.disconnect()
    return { name: 'redis', status: 'error', detail: (err as Error).message }
  }
}

function getStorageInternals(storage: StorageManager): { client: any; bucket: string; config: StorageConfig } {
  const internals = storage as unknown as { client: any; config: StorageConfig }
  return { client: internals.client, bucket: internals.config.bucket, config: internals.config }
}

async function checkStorage(provider: 'local' | StorageProvider, envResults: EnvResult[]): Promise<ServiceResult> {
  const storageErrors = envResults.filter(r => r.group === 'storage' && r.status === 'error' && r.key !== 'STORAGE_PROVIDER')
  if (storageErrors.length) {
    return {
      name: 'storage',
      status: 'error',
      detail: `Missing env: ${storageErrors.map(r => r.key).join(', ')}`,
    }
  }

  if (provider === 'local') {
    const basePath = process.env.LOCAL_STORAGE_PATH || './uploads'
    try {
      await fs.access(path.resolve(basePath))
      return { name: 'storage', status: 'ok', detail: `local storage path accessible (${basePath})` }
    } catch (err) {
      return { name: 'storage', status: 'warn', detail: `local storage path ${basePath} not accessible (${(err as Error).message})` }
    }
  }

  try {
    const storage = StorageManager.createFromSettings(provider)
    const { client, bucket } = getStorageInternals(storage)
    if (!bucket) {
      throw new Error('Bucket name not resolved')
    }
    const start = Date.now()
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
    return { name: 'storage', status: 'ok', latencyMs: Date.now() - start, detail: `${provider} bucket "${bucket}" reachable` }
  } catch (err) {
    return { name: 'storage', status: 'error', detail: (err as Error).message }
  }
}

function formatStatus(status: Status): string {
  if (status === 'ok') return '[OK  ]'
  if (status === 'warn') return '[WARN]'
  return '[ERR ]'
}

function printEnv(results: EnvResult[]) {
  const order: EnvGroup[] = ['core', 'auth', 'storage', 'redis', 'optional']
  const labels: Record<EnvGroup, string> = {
    core: 'Core',
    auth: 'Auth',
    storage: 'Storage',
    redis: 'Redis',
    optional: 'Optional',
  }
  for (const group of order) {
    const groupItems = results.filter(r => r.group === group)
    if (!groupItems.length) continue
    console.log(`\n${labels[group]} env:`)
    for (const item of groupItems) {
      const valuePart = item.value && item.value !== 'present' ? ` (${item.value})` : ''
      const detailPart = item.status === 'ok' ? '' : item.detail ? ` - ${item.detail}` : ''
      console.log(`  ${formatStatus(item.status)} ${item.key}${valuePart}${detailPart}`)
    }
  }
}

function printServices(results: ServiceResult[]) {
  console.log('\nService connectivity:')
  for (const svc of results) {
    const latency = typeof svc.latencyMs === 'number' ? ` ${svc.latencyMs}ms` : ''
    const detail = svc.detail ? ` - ${svc.detail}` : ''
    console.log(`  ${formatStatus(svc.status)} ${svc.name}${latency}${detail}`)
  }
}

function computeOverall(envResults: EnvResult[], serviceResults: ServiceResult[]): Status {
  if (envResults.some(r => r.status === 'error') || serviceResults.some(s => s.status === 'error')) {
    return 'error'
  }
  if (envResults.some(r => r.status === 'warn') || serviceResults.some(s => s.status === 'warn')) {
    return 'warn'
  }
  return 'ok'
}

async function main() {
  const startedAt = new Date().toISOString()
  const envSummary = checkEnvVars()
  const services: ServiceResult[] = []

  services.push(await checkDatabase(envSummary.results))
  services.push(await checkRedis(envSummary.results))
  services.push(await checkStorage(envSummary.provider, envSummary.results))

  let overall = computeOverall(envSummary.results, services)
  const warningsPromoted = strictMode && overall === 'warn'
  if (warningsPromoted) {
    overall = 'error'
  }

  const summary = {
    timestamp: startedAt,
    strictMode,
    warningsPromoted,
    env: envSummary.results,
    services,
    overall,
  }

  if (outputJson) {
    console.log(JSON.stringify(summary, null, 2))
  } else {
    console.log('CCFrame health check')
    console.log(`Started: ${startedAt}`)
    printEnv(envSummary.results)
    printServices(services)
    console.log(`\nOverall: ${formatStatus(overall)}${warningsPromoted ? ' (warnings promoted to errors due to --strict)' : ''}`)
  }

  if (overall === 'error') {
    process.exitCode = 1
  }
}

main()
  .catch(err => {
    console.error('Healthcheck failed:', err)
    process.exitCode = 2
  })
  .finally(() => {
    db.$disconnect().catch(() => undefined)
  })
