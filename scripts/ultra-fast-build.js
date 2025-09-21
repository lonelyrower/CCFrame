#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const rootDir = path.resolve(__dirname, '..')
const configPath = path.join(rootDir, 'next.config.js')
const backupPath = path.join(rootDir, 'next.config.original.js')
const fastConfigPath = path.join(rootDir, 'next.config.fast.js')
const perfDir = path.join(rootDir, 'logs', 'perf')
const buildLogPath = path.join(perfDir, 'build-metrics.json')

fs.mkdirSync(perfDir, { recursive: true })

console.log('⚙️  启动极速构建模式')

if (fs.existsSync(configPath) && !fs.existsSync(backupPath)) {
  fs.copyFileSync(configPath, backupPath)
  console.log('📝 已备份原始 next.config.js')
}

if (fs.existsSync(fastConfigPath)) {
  fs.copyFileSync(fastConfigPath, configPath)
  console.log('🚀 已切换至 next.config.fast.js')
}

console.log('🧹 清理旧的构建缓存...')
if (fs.existsSync(path.join(rootDir, '.next'))) {
  fs.rmSync(path.join(rootDir, '.next'), { recursive: true, force: true })
}
if (fs.existsSync(path.join(rootDir, 'tsconfig.tsbuildinfo'))) {
  fs.rmSync(path.join(rootDir, 'tsconfig.tsbuildinfo'), { force: true })
}

process.env.NODE_ENV = 'production'
process.env.NEXT_TELEMETRY_DISABLED = '1'
process.env.CI = process.env.CI || '1'

console.log('🏗️  开始执行 next build ...')
const startedAt = Date.now()

function appendBuildMetrics(entry) {
  let history = []
  if (fs.existsSync(buildLogPath)) {
    try {
      history = JSON.parse(fs.readFileSync(buildLogPath, 'utf8'))
    } catch (error) {
      console.warn('⚠️  无法解析现有 build-metrics.json，将重新生成文件')
    }
  }
  history.push(entry)
  fs.writeFileSync(buildLogPath, JSON.stringify(history, null, 2))
}

try {
  const result = spawnSync('npx', ['next', 'build'], {
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=2048',
    },
    encoding: 'utf8',
  })

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  if (result.status !== 0) {
    throw new Error(`next build 退出码 ${result.status}`)
  }

  const durationSeconds = (Date.now() - startedAt) / 1000
  const summary = { durationSeconds }

  const output = `${result.stdout}\n${result.stderr}`
  const firstLoadMatch = output.match(/First Load JS shared by all\s+([0-9.]+\s?[kMG]B)/i)
  if (firstLoadMatch) {
    summary.firstLoadJs = firstLoadMatch[1]
  }

  const totalRoutes = (output.match(/^[┌├]/gm) || []).length
  summary.routes = totalRoutes

  appendBuildMetrics({
    timestamp: new Date().toISOString(),
    ...summary,
  })

  console.log(`✅ 构建完成，用时 ${durationSeconds.toFixed(2)}s`)
  if (summary.firstLoadJs) {
    console.log(`📦 First Load JS: ${summary.firstLoadJs}`)
  }
  console.log(`🗂️  记录已追加至 ${path.relative(rootDir, buildLogPath)}`)
} catch (error) {
  console.error('❌ 构建失败:', error.message)
  process.exitCode = 1
} finally {
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, configPath)
    console.log('♻️  已恢复原始 next.config.js')
  }
}
