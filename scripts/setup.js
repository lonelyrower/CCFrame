#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up Personal Photo Gallery...\n')

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from .env.example...')
  fs.copyFileSync('.env.example', '.env')
  console.log('✅ Please edit .env with your configuration\n')
} else {
  console.log('✅ .env file already exists\n')
}

// Install dependencies
console.log('📦 Installing dependencies...')
try {
  execSync('npm install', { stdio: 'inherit' })
  console.log('✅ Dependencies installed\n')
} catch (error) {
  console.error('❌ Failed to install dependencies')
  process.exit(1)
}

// Generate Prisma client
console.log('🗄️  Generating Prisma client...')
try {
  execSync('npm run db:generate', { stdio: 'inherit' })
  console.log('✅ Prisma client generated\n')
} catch (error) {
  console.error('❌ Failed to generate Prisma client')
  console.log('Make sure your DATABASE_URL is configured in .env\n')
}

console.log('🎉 Setup complete!\n')
console.log('Next steps:')
console.log('1. Configure your .env file with proper values')
console.log('2. Set up your PostgreSQL database')
console.log('3. Set up your Redis instance') 
console.log('4. Configure your S3-compatible storage')
console.log('5. Run: npm run db:migrate')
console.log('6. Run: npm run dev')
console.log('\nFor detailed instructions, see README.md')