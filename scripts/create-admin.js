const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@local.dev'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail)
      return existingAdmin
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash
      }
    })

    console.log('Admin user created successfully!')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('Please change the password after first login.')

    return admin
  } catch (error) {
    console.error('Error creating admin user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))