#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 超快速构建模式')

// 备份原配置
if (fs.existsSync('next.config.js') && !fs.existsSync('next.config.original.js')) {
  fs.copyFileSync('next.config.js', 'next.config.original.js')
  console.log('📋 已备份原始配置')
}

// 使用快速配置
if (fs.existsSync('next.config.fast.js')) {
  fs.copyFileSync('next.config.fast.js', 'next.config.js')
  console.log('⚡ 切换到快速构建配置')
}

// 清理缓存
console.log('🧹 清理构建缓存...')
if (fs.existsSync('.next')) {
  execSync('rm -rf .next', { stdio: 'inherit' })
}
if (fs.existsSync('tsconfig.tsbuildinfo')) {
  fs.unlinkSync('tsconfig.tsbuildinfo')
}

// 设置环境变量
process.env.NODE_ENV = 'production'
process.env.NEXT_TELEMETRY_DISABLED = '1'
process.env.CI = '1' // 某些包在 CI 环境下会跳过非必要步骤

console.log('📦 开始超快速构建...')
const startTime = Date.now()

try {
  // 直接构建，不做类型检查
  execSync('next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=2048'
    }
  })
  
  const buildTime = (Date.now() - startTime) / 1000
  console.log(`✅ 构建完成！耗时: ${buildTime.toFixed(2)}s`)
  
} catch (error) {
  console.error('❌ 构建失败:', error.message)
  process.exit(1)
} finally {
  // 恢复原配置
  if (fs.existsSync('next.config.original.js')) {
    fs.copyFileSync('next.config.original.js', 'next.config.js')
    console.log('🔄 已恢复原始配置')
  }
}