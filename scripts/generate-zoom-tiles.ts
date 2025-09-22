#!/usr/bin/env tsx

import { promises as fs } from 'fs'
import path from 'path'
import { Queue } from 'bullmq'

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

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limitArg = args.find((arg) => arg.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) || 20 : 20
  const photoArg = args.find((arg) => arg.startsWith('--photo='))

  const timestamp = new Date().toISOString()
  const logDir = path.join(process.cwd(), 'logs', 'zoom')
  const logFile = path.join(logDir, `${timestamp.replace(/[:]/g, '-')}.log`)

  await fs.mkdir(logDir, { recursive: true })

  const header = `# Zoom Tile Generation\n- timestamp: ${timestamp}\n- dryRun: ${dryRun}\n- limit: ${limit}\n`
  await fs.appendFile(logFile, header, 'utf8')

  if (dryRun) {
    const message = 'Dry run enabled. No tiles were generated.'
    await fs.appendFile(logFile, `${message}\n`, 'utf8')
    console.log(message)
    return
  }

  const { connection } = createConnection()
  const queueName = 'zoom-tiler'
  const queue = new Queue(queueName, { connection })

  const jobs = []
  if (photoArg) {
    const photoId = photoArg.split('=')[1]
    if (photoId) {
      jobs.push({ name: 'zoom-tiles', data: { photoId } })
    }
  } else {
    for (let index = 0; index < limit; index += 1) {
      jobs.push({ name: 'zoom-tiles', data: { photoId: `generator-${timestamp}-${index}` } })
    }
  }

  if (jobs.length === 0) {
    const message = 'No jobs queued. Provide --photo=<id> or --limit=<n>.'
    await fs.appendFile(logFile, `${message}\n`, 'utf8')
    console.log(message)
    return
  }

  await queue.addBulk(jobs)
  const message = `Queued ${jobs.length} zoom tiler job(s).`
  await fs.appendFile(logFile, `${message}\n`, 'utf8')
  console.log(message)
}

main().catch((error) => {
  console.error('[zoom:generate] failed', error)
  process.exit(1)
})
