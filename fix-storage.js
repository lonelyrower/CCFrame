#!/usr/bin/env node

/**
 * 存储配置修复脚本
 * 用于诊断和修复 CCFrame 项目的存储配置问题
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 CCFrame 存储配置修复脚本\n')

// 1. 检查当前存储提供者配置
function checkStorageConfig() {
  console.log('📋 检查存储配置...')
  
  const storageProvider = process.env.STORAGE_PROVIDER || 'minio'
  console.log(`当前存储提供者: ${storageProvider}`)
  
  if (storageProvider === 'local') {
    console.log('✅ 使用本地存储，无需额外配置')
    return 'local'
  }
  
  // 检查必需的环境变量
  const requiredVars = {
    minio: [
      'S3_ENDPOINT',
      'S3_ACCESS_KEY_ID', 
      'S3_SECRET_ACCESS_KEY',
      'S3_BUCKET_NAME'
    ],
    aws: [
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY', 
      'AWS_S3_BUCKET'
    ]
  }
  
  const required = requiredVars[storageProvider] || requiredVars.minio
  const missing = []
  
  console.log('\n检查必需的环境变量:')
  required.forEach(key => {
    const value = process.env[key]
    if (!value || value.includes('your-')) {
      missing.push(key)
      console.log(`❌ ${key}: 未配置或使用占位符值`)
    } else {
      const displayValue = key.includes('SECRET') || key.includes('PASSWORD') 
        ? '***隐藏***'
        : value
      console.log(`✅ ${key}: ${displayValue}`)
    }
  })
  
  if (missing.length > 0) {
    console.log(`\n⚠️  发现 ${missing.length} 个配置问题`)
    return 'needs_config'
  }
  
  return storageProvider
}

// 2. 生成本地存储配置
function generateLocalConfig() {
  console.log('\n🔄 切换到本地存储配置...')
  
  const localConfig = `# 本地存储配置 (临时修复方案)
STORAGE_PROVIDER=local
UPLOAD_PATH=./uploads

# 确保上传目录存在
LOCAL_STORAGE_PATH=./uploads
`

  // 创建上传目录
  const uploadsDir = path.join(process.cwd(), 'uploads')
  const subdirs = ['originals', 'variants', 'enhanced', 'upscaled', 'no-bg']
  
  subdirs.forEach(subdir => {
    const dirPath = path.join(uploadsDir, subdir)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      console.log(`✅ 创建目录: ${dirPath}`)
    }
  })

  // 写入临时配置文件
  fs.writeFileSync('.env.local.fix', localConfig)
  console.log('✅ 生成本地存储配置文件: .env.local.fix')
  
  console.log('\n📝 请执行以下命令应用配置:')
  console.log('cp .env.local.fix .env.local')
  console.log('或者将以下内容添加到你的 .env 文件中:')
  console.log(localConfig)
}

// 3. 生成MinIO配置模板
function generateMinioTemplate() {
  console.log('\n📋 生成MinIO配置模板...')
  
  const minioTemplate = `# MinIO 存储配置
STORAGE_PROVIDER=minio

# MinIO服务器配置 (请根据你的实际MinIO服务器修改)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=ccframe-photos
S3_FORCE_PATH_STYLE=true

# 如果你使用Docker MinIO，可能需要修改endpoint为:
# S3_ENDPOINT=http://minio:9000  (如果在Docker网络中)
# 或
# S3_ENDPOINT=http://你的服务器IP:9000
`

  fs.writeFileSync('.env.minio.template', minioTemplate)
  console.log('✅ 生成MinIO配置模板: .env.minio.template')
  
  console.log('\n🐳 如果你想快速启动MinIO服务器，可以运行:')
  console.log('docker run -d --name minio \\')
  console.log('  -p 9000:9000 -p 9001:9001 \\')
  console.log('  -e MINIO_ROOT_USER=minioadmin \\')
  console.log('  -e MINIO_ROOT_PASSWORD=minioadmin \\')
  console.log('  -v ./minio-data:/data \\')
  console.log('  minio/minio server /data --console-address ":9001"')
}

// 4. 主修复流程
async function main() {
  try {
    const configStatus = checkStorageConfig()
    
    if (configStatus === 'local') {
      console.log('\n✅ 当前配置正常，使用本地存储')
      return
    }
    
    if (configStatus === 'needs_config') {
      console.log('\n🔧 提供修复方案:')
      console.log('\n方案1: 切换到本地存储 (推荐，简单快速)')
      generateLocalConfig()
      
      console.log('\n方案2: 配置MinIO (功能更完整)')
      generateMinioTemplate()
      
      console.log('\n📌 建议:')
      console.log('1. 如果只是测试，使用方案1 (本地存储)')
      console.log('2. 如果是生产环境，使用方案2 (MinIO)')
      console.log('3. 应用配置后重启应用')
      console.log('\n重启命令: npm run dev  (开发环境)')
      console.log('或: pm2 restart ccframe  (生产环境)')
    }
    
  } catch (error) {
    console.error('❌ 修复脚本执行失败:', error.message)
    process.exit(1)
  }
}

main()