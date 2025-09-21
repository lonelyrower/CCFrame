#!/usr/bin/env node

/**
 * Simple Upload Test
 * Tests basic storage setup and file operations
 */

const fs = require('fs')
const path = require('path')

function testUploadDirectory() {
  console.log('🧪 Testing uploads directory...')

  const uploadsDir = path.resolve('./uploads')

  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true })
      console.log(`   ✅ Created uploads directory: ${uploadsDir}`)
    } catch (error) {
      console.log(`   ❌ Failed to create uploads directory: ${error.message}`)
      return false
    }
  } else {
    console.log(`   ✅ Uploads directory exists: ${uploadsDir}`)
  }

  // Test write permissions
  const testFile = path.join(uploadsDir, 'test-write.txt')
  try {
    fs.writeFileSync(testFile, 'test content')
    fs.unlinkSync(testFile)
    console.log(`   ✅ Directory is writable`)
    return true
  } catch (error) {
    console.log(`   ❌ Directory is not writable: ${error.message}`)
    return false
  }
}

function testEnvironmentVariables() {
  console.log('🧪 Testing environment variables...')

  const required = [
    'STORAGE_PROVIDER',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  const missing = []
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    console.log(`   ❌ Missing environment variables: ${missing.join(', ')}`)
    return false
  } else {
    console.log(`   ✅ All required environment variables are set`)
    return true
  }
}

function testFileStructure() {
  console.log('🧪 Testing required file structure...')

  const requiredPaths = [
    './package.json',
    './lib',
    './app/api/upload',
    './.env'
  ]

  for (const filePath of requiredPaths) {
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ Missing required path: ${filePath}`)
      return false
    }
  }

  console.log(`   ✅ All required files and directories exist`)
  return true
}

function main() {
  console.log('🚀 CCFrame Simple Upload Test\n')

  // Load environment variables from .env file
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
    console.log('📄 Loaded environment variables from .env file\n')
  }

  const tests = [
    testFileStructure(),
    testEnvironmentVariables(),
    testUploadDirectory()
  ]

  const allPassed = tests.every(Boolean)

  console.log('\n📊 Test Summary:')
  if (allPassed) {
    console.log('   ✅ All basic tests passed! The environment is ready for uploads.')
    console.log('   💡 Try starting the application with: npm run dev')
  } else {
    console.log('   ❌ Some tests failed. Fix the issues above before proceeding.')
  }

  process.exit(allPassed ? 0 : 1)
}

if (require.main === module) {
  main()
}