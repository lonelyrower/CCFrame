const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD

if (!adminEmail || !adminPassword) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set before running this script.')
  process.exit(1)
}

async function createAdmin() {
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail)
      return existingAdmin
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12)

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash
      }
    })

    console.log('Admin user created successfully for', adminEmail)
    console.log('The password supplied via ADMIN_PASSWORD has been stored securely. Please rotate it after first login.')

    return admin
  } catch (error) {
    console.error('Error creating admin user:', error instanceof Error ? error.message : error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
