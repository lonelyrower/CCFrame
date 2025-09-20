#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const CACHE_DIR = '.next/cache'
const MAX_CACHE_SIZE = 100 * 1024 * 1024 // 100MB 限制

/**
 * 获取目录大小（字节）
 */
function getDirSize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0
  
  let size = 0
  const files = fs.readdirSync(dirPath)
  
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stats = fs.statSync(filePath)
    
    if (stats.isDirectory()) {
      size += getDirSize(filePath)
    } else {
      size += stats.size
    }
  }
  
  return size
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 清理构建缓存
 */
function cleanCache() {
  console.log('🧹 清理构建缓存...')
  
  try {
    if (fs.existsSync(CACHE_DIR)) {
      const beforeSize = getDirSize(CACHE_DIR)
      console.log(`缓存目录大小: ${formatBytes(beforeSize)}`)
      
      // 删除缓存目录
      execSync(`rm -rf ${CACHE_DIR}`, { stdio: 'inherit' })
      console.log('✅ 缓存已清理')
    } else {
      console.log('ℹ️  缓存目录不存在，无需清理')
    }
  } catch (error) {
    console.error('❌ 清理缓存失败:', error.message)
  }
}

/**
 * 优化的构建函数
 */
function optimizedBuild() {
  console.log('🚀 开始优化构建流程...')
  
  // 检查缓存大小
  if (fs.existsSync(CACHE_DIR)) {
    const cacheSize = getDirSize(CACHE_DIR)
    console.log(`当前缓存大小: ${formatBytes(cacheSize)}`)
    
    if (cacheSize > MAX_CACHE_SIZE) {
      console.log(`⚠️  缓存大小超过限制 (${formatBytes(MAX_CACHE_SIZE)})，将清理缓存`)
      cleanCache()
    }
  }
  
  // 设置构建环境变量
  process.env.ANALYZE = 'false'
  
  console.log('📦 开始 Next.js 构建...')
  
  const startTime = Date.now()
  
  try {
    // 并行执行 TypeScript 类型检查和 Next.js 构建
    execSync('npm run type-check & npm run build:original', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1'
      }
    })
    
    const buildTime = (Date.now() - startTime) / 1000
    console.log(`✅ 构建完成！耗时: ${buildTime.toFixed(2)}s`)
    
    // 显示最终缓存大小
    if (fs.existsSync(CACHE_DIR)) {
      const finalCacheSize = getDirSize(CACHE_DIR)
      console.log(`构建后缓存大小: ${formatBytes(finalCacheSize)}`)
    }
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message)
    process.exit(1)
  }
}

/**
 * 快速构建（强制清理缓存）
 */
function fastBuild() {
  console.log('⚡ 快速构建模式（清理所有缓存）')
  
  // 清理所有缓存
  cleanCache()
  
  // 清理 TypeScript 构建信息
  const tsBuildInfo = 'tsconfig.tsbuildinfo'
  if (fs.existsSync(tsBuildInfo)) {
    fs.unlinkSync(tsBuildInfo)
    console.log('✅ 清理 TypeScript 构建信息')
  }
  
  // 执行构建
  optimizedBuild()
}

// 主程序逻辑
const command = process.argv[2]

switch (command) {
  case 'clean':
    cleanCache()
    break
  case 'fast':
    fastBuild()
    break
  case 'analyze':
    process.env.ANALYZE = 'true'
    optimizedBuild()
    break
  default:
    optimizedBuild()
}