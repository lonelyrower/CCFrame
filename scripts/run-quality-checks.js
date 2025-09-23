#!/usr/bin/env node

const { spawnSync } = require('child_process')

const tasks = [
  { name: 'lint', command: 'npm', args: ['run', 'lint'] },
  { name: 'admin:lint', command: 'npm', args: ['run', 'admin:lint'] },
  { name: 'type-check', command: 'npm', args: ['run', 'type-check'] },
  { name: 'test:admin', command: 'npm', args: ['run', 'test:admin'] },
  { name: 'test:lightbox', command: 'npm', args: ['run', 'test:lightbox'] },
  { name: 'storybook:ci', command: 'npm', args: ['run', 'storybook:ci'] },
  { name: 'admin:health', command: 'npm', args: ['run', 'admin:health'] },
  { name: 'build', command: 'npm', args: ['run', 'build'] },
  { name: 'lighthouse:budget', command: 'npm', args: ['run', 'lighthouse:budget'] },
]

let hasError = false

for (const task of tasks) {
  console.log(`▶️  Running ${task.args.join(' ')}...`)
  const result = spawnSync(task.command, task.args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    hasError = true
    console.error(`❌ Task ${task.name} failed with exit code ${result.status}`)
    break
  }
  console.log(`✅ ${task.name} passed`) 
}

if (hasError) {
  process.exit(1)
}

console.log('🎉 All verification tasks passed')
