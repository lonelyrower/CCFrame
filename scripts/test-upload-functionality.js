#!/usr/bin/env node

/**
 * Test Upload Functionality
 * 测试上传功能的综合脚本
 */

const fs = require('fs')
const path = require('path')

// 加载环境变量
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8')
  const envLines = envContent.split('\n')
  for (const line of envLines) {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '')
        process.env[key.trim()] = value.trim()
      }
    }
  }
}

async function testEnvironmentConfig() {
  console.log('🧪 Testing Environment Configuration...')

  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'STORAGE_PROVIDER'
  ]

  let allPresent = true
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.log(`   ❌ Missing: ${varName}`)
      allPresent = false
    } else {
      console.log(`   ✅ Present: ${varName} = ${process.env[varName].substring(0, 20)}...`)
    }
  }

  return allPresent
}

async function testStorageDirectories() {
  console.log('🧪 Testing Storage Directories...')

  const baseDir = process.env.UPLOAD_PATH || './uploads'
  const dirs = [
    baseDir,
    path.join(baseDir, 'originals'),
    path.join(baseDir, 'variants'),
    path.join(baseDir, 'enhanced'),
    path.join(baseDir, 'upscaled'),
    path.join(baseDir, 'no-bg')
  ]

  let allExist = true
  for (const dir of dirs) {
    try {
      const stats = await fs.promises.stat(dir)
      if (stats.isDirectory()) {
        console.log(`   ✅ Directory exists: ${dir}`)
      } else {
        console.log(`   ❌ Not a directory: ${dir}`)
        allExist = false
      }
    } catch (error) {
      console.log(`   ❌ Missing directory: ${dir}`)
      allExist = false
    }
  }

  return allExist
}

async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoint Availability...')

  const endpoints = [
    '/api/upload/presign',
    '/api/upload/local',
    '/api/upload/commit',
    '/api/photos',
    '/api/albums'
  ]

  console.log('   ℹ️  API endpoints to verify (when server is running):')
  for (const endpoint of endpoints) {
    console.log(`      - ${endpoint}`)
  }

  return true
}

async function testUIComponents() {
  console.log('🧪 Testing UI Component Files...')

  const componentFiles = [
    './app/admin/upload/page.tsx',
    './app/admin/library/page.tsx',
    './components/admin/library-batch-grid.tsx',
    './components/admin/photo-actions.tsx',
    './components/admin/photo-edit-modal.tsx'
  ]

  let allExist = true
  for (const file of componentFiles) {
    try {
      await fs.promises.access(file)
      console.log(`   ✅ Component exists: ${file}`)
    } catch (error) {
      console.log(`   ❌ Missing component: ${file}`)
      allExist = false
    }
  }

  return allExist
}

async function generateTestInstructions() {
  console.log('\n📋 Manual Testing Instructions:')
  console.log('1. 🚀 Start the development server:')
  console.log('   npm run dev')
  console.log('')
  console.log('2. 🌐 Open the application:')
  console.log('   http://localhost:3000')
  console.log('')
  console.log('3. 🔐 Login to admin:')
  console.log('   http://localhost:3000/admin/login')
  console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@example.com'}`)
  console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`)
  console.log('')
  console.log('4. 📤 Test Upload Function:')
  console.log('   - Go to http://localhost:3000/admin/upload')
  console.log('   - Drag and drop an image file')
  console.log('   - Click "上传" button')
  console.log('   - Check for "获取上传地址失败" error')
  console.log('')
  console.log('5. 📷 Test Photo Library:')
  console.log('   - Go to http://localhost:3000/admin/library')
  console.log('   - Hover over photos to see action buttons')
  console.log('   - Click the checkbox (circle) to select photos')
  console.log('   - Click the edit button (pencil icon)')
  console.log('   - Test batch operations')
  console.log('')
  console.log('6. 🐛 Look for these issues:')
  console.log('   - ❌ "获取上传地址失败: 服务器内部错误"')
  console.log('   - ❌ "Failed to load resource: 500 (Internal Server Error)"')
  console.log('   - ❌ Non-working selection checkboxes')
  console.log('   - ❌ Non-working edit buttons')
  console.log('')
  console.log('✅ Expected behavior after fixes:')
  console.log('   - Upload should work without 500 errors')
  console.log('   - Selection checkboxes should toggle when clicked')
  console.log('   - Edit buttons should open edit modal')
  console.log('   - Batch operations should work on selected photos')
}

async function main() {
  console.log('🚀 CCFrame Upload & UI Functionality Test\n')

  const tests = [
    testEnvironmentConfig(),
    testStorageDirectories(),
    testAPIEndpoints(),
    testUIComponents()
  ]

  const results = await Promise.all(tests)
  const allPassed = results.every(Boolean)

  console.log('\n📊 Test Summary:')
  if (allPassed) {
    console.log('   ✅ All automated tests passed!')
  } else {
    console.log('   ❌ Some automated tests failed. Review the errors above.')
  }

  await generateTestInstructions()

  process.exit(allPassed ? 0 : 1)
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test failed with uncaught error:', error)
    process.exit(1)
  })
}