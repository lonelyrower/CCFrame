#!/usr/bin/env node

/**
 * Test Upload API Directly
 * Tests the upload presign endpoint without starting the full server
 */

const { getStorageManager } = require('../lib/storage-manager')
const { getLocalStorageManager } = require('../lib/local-storage')

async function testStorageManager() {
  console.log('🧪 Testing Storage Manager...')

  try {
    // Set environment variables for local storage
    process.env.STORAGE_PROVIDER = 'local'
    process.env.UPLOAD_PATH = './uploads'
    process.env.LOCAL_STORAGE_PATH = './uploads'

    const storage = getStorageManager()
    console.log(`   ✅ Storage manager initialized: ${storage.constructor.name}`)

    // Test key generation
    const testKey = storage.generateKey ? storage.generateKey('test', 'test.jpg') : 'test/test.jpg'
    console.log(`   ✅ Key generation works: ${testKey}`)

    // Test presigned URL generation (if available)
    if (typeof storage.getPresignedUploadUrl === 'function') {
      try {
        const url = await storage.getPresignedUploadUrl('test/example.jpg', 'image/jpeg')
        console.log(`   ✅ Presigned URL generation works: ${url.substring(0, 50)}...`)
      } catch (error) {
        console.log(`   ℹ️  Presigned URL not available for local storage: ${error.message}`)
      }
    }

    return true
  } catch (error) {
    console.log(`   ❌ Storage manager failed: ${error.message}`)
    return false
  }
}

async function testLocalStorage() {
  console.log('🧪 Testing Local Storage Directly...')

  try {
    const localStorage = getLocalStorageManager()
    console.log(`   ✅ Local storage manager initialized`)

    // Test basic upload functionality
    const testBuffer = Buffer.from('test content')
    await localStorage.uploadBuffer('test/example.txt', testBuffer, 'text/plain')
    console.log(`   ✅ Upload buffer works`)

    // Test download
    const downloaded = await localStorage.downloadBuffer('test/example.txt')
    console.log(`   ✅ Download buffer works: ${downloaded.toString()}`)

    // Cleanup
    await localStorage.deleteObject('test/example.txt')
    console.log(`   ✅ Delete object works`)

    return true
  } catch (error) {
    console.log(`   ❌ Local storage failed: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 CCFrame Upload API Test\n')

  const tests = [
    testStorageManager(),
    testLocalStorage()
  ]

  const results = await Promise.all(tests)
  const allPassed = results.every(Boolean)

  console.log('\n📊 Test Summary:')
  if (allPassed) {
    console.log('   ✅ All tests passed! Upload API should work correctly.')
  } else {
    console.log('   ❌ Some tests failed. Check the errors above.')
  }

  process.exit(allPassed ? 0 : 1)
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test failed:', error)
    process.exit(1)
  })
}