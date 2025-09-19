#!/usr/bin/env node

// Node.js script to start worker with robust path resolution
const { resolve } = require('path')
const { existsSync } = require('fs')
const { execSync } = require('child_process')

function pickTsx() {
  const candidates = [
    resolve('./node_modules/.bin/tsx'),
    '/app/node_modules/.bin/tsx',
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  console.error('Cannot find tsx runtime in node_modules/.bin')
  process.exit(1)
}

function pickWorkerEntry() {
  // Primary path
  let p = resolve('./jobs/worker.ts')
  if (existsSync(p)) return p
  // Fallback: some images may bundle jobs under scripts
  p = resolve('./scripts/jobs/worker.ts')
  if (existsSync(p)) return p
  console.error('Cannot find worker entry (jobs/worker.ts)')
  process.exit(1)
}

const tsxPath = pickTsx()
const workerPath = pickWorkerEntry()

console.log('Starting worker via tsx:', workerPath)
try {
  const env = { ...process.env, START_WORKERS: process.env.START_WORKERS || 'true' }
  execSync(`${tsxPath} --tsconfig tsconfig.json ${workerPath}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env,
  })
} catch (error) {
  console.error('Worker failed:', error && error.message ? error.message : error)
  process.exit(1)
}
