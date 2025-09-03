#!/usr/bin/env node

// Node.js script to start worker with proper module resolution
const { resolve } = require('path')
const { execSync } = require('child_process')

// Register tsx with proper tsconfig
const tsxPath = resolve('./node_modules/.bin/tsx')
const workerPath = resolve('./jobs/worker.ts')

console.log('Starting worker...')
try {
  execSync(`${tsxPath} --tsconfig tsconfig.json ${workerPath}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
} catch (error) {
  console.error('Worker failed:', error.message)
  process.exit(1)
}