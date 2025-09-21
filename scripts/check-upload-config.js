#!/usr/bin/env node

/**
 * Upload Configuration Health Check Script
 * Diagnoses common upload configuration issues
 */

const fs = require('fs')
const path = require('path')

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...')

  const storageProvider = process.env.STORAGE_PROVIDER || 'minio'
  console.log(`   Storage Provider: ${storageProvider}`)

  const requiredVarsMap = {
    local: [],
    minio: ['S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'],
    aws: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'],
    aliyun: ['ALIYUN_REGION', 'ALIYUN_ACCESS_KEY_ID', 'ALIYUN_SECRET_ACCESS_KEY', 'ALIYUN_OSS_BUCKET'],
    qcloud: ['QCLOUD_REGION', 'QCLOUD_SECRET_ID', 'QCLOUD_SECRET_KEY', 'QCLOUD_COS_BUCKET']
  }

  const required = requiredVarsMap[storageProvider] || []
  const missing = []

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    console.log(`   ❌ Missing required environment variables for ${storageProvider}:`)
    missing.forEach(name => console.log(`      - ${name}`))
    return false
  } else {
    console.log(`   ✅ All required environment variables present for ${storageProvider}`)
    return true
  }
}

function checkRuntimeConfig() {
  console.log('🔍 Checking runtime configuration...')

  const configPath = path.resolve(process.cwd(), 'config', 'runtime-config.json')

  if (!fs.existsSync(configPath)) {
    console.log(`   ⚠️  Runtime config file not found at: ${configPath}`)
    console.log('   💡 This might be okay if using only environment variables')
    return true
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8')
    const config = JSON.parse(content)
    console.log('   ✅ Runtime config file is valid JSON')
    console.log('   📋 Configuration content:')
    console.log(JSON.stringify(config, null, 4))
    return true
  } catch (error) {
    console.log(`   ❌ Runtime config file is invalid: ${error.message}`)
    return false
  }
}

function checkDatabaseConnection() {
  console.log('🔍 Checking database configuration...')

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.log('   ❌ DATABASE_URL environment variable is missing')
    return false
  }

  console.log('   ✅ DATABASE_URL is configured')
  return true
}

function checkNextAuth() {
  console.log('🔍 Checking NextAuth configuration...')

  const secret = process.env.NEXTAUTH_SECRET
  const url = process.env.NEXTAUTH_URL

  if (!secret) {
    console.log('   ❌ NEXTAUTH_SECRET environment variable is missing')
    return false
  }

  if (!url) {
    console.log('   ❌ NEXTAUTH_URL environment variable is missing')
    return false
  }

  console.log('   ✅ NextAuth is properly configured')
  return true
}

function suggestFixes() {
  console.log('\n🔧 Suggested fixes:')
  console.log('1. Ensure your .env file exists and contains all required variables')
  console.log('2. If using MinIO, make sure the MinIO server is running and accessible')
  console.log('3. Check that all credentials are correct and have proper permissions')
  console.log('4. Consider creating a runtime-config.json for dynamic configuration')
  console.log('5. Restart the application after making any configuration changes')
}

function main() {
  console.log('🚀 CCFrame Upload Configuration Health Check\n')

  const checks = [
    checkEnvironmentVariables(),
    checkRuntimeConfig(),
    checkDatabaseConnection(),
    checkNextAuth()
  ]

  const allPassed = checks.every(Boolean)

  console.log('\n📊 Summary:')
  if (allPassed) {
    console.log('   ✅ All checks passed! Configuration looks good.')
  } else {
    console.log('   ❌ Some checks failed. Review the issues above.')
    suggestFixes()
  }

  process.exit(allPassed ? 0 : 1)
}

if (require.main === module) {
  main()
}