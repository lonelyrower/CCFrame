// 简单的存储配置诊断脚本
console.log('=== 存储配置诊断 ===\n')

// 检查环境变量
const envVars = [
  'STORAGE_PROVIDER',
  'S3_ENDPOINT', 'MINIO_ENDPOINT',
  'S3_BUCKET_NAME', 'MINIO_BUCKET',
  'S3_ACCESS_KEY_ID', 'MINIO_ROOT_USER',
  'S3_SECRET_ACCESS_KEY', 'MINIO_ROOT_PASSWORD',
  'S3_REGION', 'MINIO_REGION'
]

console.log('环境变量:')
envVars.forEach(key => {
  const value = process.env[key]
  if (value) {
    const displayValue = key.includes('SECRET') || key.includes('PASSWORD') 
      ? '*'.repeat(value.length)
      : value
    console.log(`  ${key} = ${displayValue}`)
  } else {
    console.log(`  ${key} = (未设置)`)
  }
})

console.log('\n运行时配置文件:')
try {
  const fs = require('fs')
  const configPath = './runtime-config.json'
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    console.log(JSON.stringify(config, null, 2))
  } else {
    console.log('  runtime-config.json 不存在')
  }
} catch (error) {
  console.log(`  错误: ${error.message}`)
}

console.log('\n存储管理器初始化测试:')
try {
  // 动态加载模块
  const { getStorageManager } = require('./lib/storage-manager')
  const storage = getStorageManager()
  console.log(`  存储管理器类型: ${storage.constructor.name}`)
  
  if (typeof storage.healthCheck === 'function') {
    console.log('  正在进行健康检查...')
    storage.healthCheck().then(result => {
      console.log('  健康检查结果:', result)
    }).catch(err => {
      console.log('  健康检查失败:', err.message)
    })
  }
} catch (error) {
  console.log(`  初始化失败: ${error.message}`)
}