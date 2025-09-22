#!/usr/bin/env tsx

import { Queue, Worker, type JobsOptions } from 'bullmq'
import path from 'path'

const queueName = 'zoom-tiler'

function createConnection() {
  const url = process.env.REDIS_URL
  if (url) {
    return { connection: { url } }
  }
  return {
    connection: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
    },
  }
}

const connection = createConnection().connection
const queue = new Queue(queueName, { connection })

async function enqueueFromCLI() {
  const [, , ...args] = process.argv
  const photoIdArg = args.find((arg) => arg.startsWith('--photo='))
  const limitArg = args.find((arg) => arg.startsWith('--limit='))

  if (!photoIdArg && !limitArg) {
    console.log('Usage: tsx jobs/zoom-tiler.ts --photo=<id> [--priority=<n>] | --limit=<n>')
    return
  }

  const jobs: Array<{ name: string; data: { photoId: string }; opts?: JobsOptions }> = []

  if (photoIdArg) {
    const photoId = photoIdArg.split('=')[1]
    if (!photoId) {
      console.error('Missing photo id')
      return
    }
    jobs.push({ name: 'zoom-tiles', data: { photoId } })
  }

  const limit = limitArg ? Number(limitArg.split('=')[1]) : NaN
  if (!Number.isNaN(limit) && limit > 0) {
    for (let index = 0; index < limit; index += 1) {
      jobs.push({ name: 'zoom-tiles', data: { photoId: `queued-${index}` } })
    }
  }

  if (jobs.length === 0) {
    console.log('No jobs enqueued')
    return
  }

  await queue.addBulk(jobs)
  console.log(`Enqueued ${jobs.length} zoom tiler job(s).`)
}

function startWorker() {
  const worker = new Worker(
    queueName,
    async (job) => {
      const started = new Date().toISOString()
      console.log(`[ZoomTiler] processing photo ${job.data.photoId} at ${started}`)
      await new Promise((resolve) => setTimeout(resolve, 250))
      const logDir = path.join(process.cwd(), 'logs', 'zoom')
      await import('fs/promises').then(async (fs) => {
        await fs.mkdir(logDir, { recursive: true })
        const logPath = path.join(logDir, `${job.id}.log`)
        await fs.appendFile(logPath, `processed ${job.data.photoId} at ${started}\n`, 'utf8')
      })
      return { processedAt: started }
    },
    { connection },
  )

  worker.on('completed', (job) => {
    console.log(`[ZoomTiler] completed job ${job.id}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[ZoomTiler] job ${job?.id} failed`, err)
  })
}

if (process.env.START_WORKERS === 'true') {
  startWorker()
} else {
  enqueueFromCLI().finally(() => process.exit(0))
}
