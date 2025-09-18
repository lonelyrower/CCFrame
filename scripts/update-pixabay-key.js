const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updatePixabayKey() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@local.dev'
    const pixabayKey = process.env.PIXABAY_API_KEY || '46529562-43aa8e956d8bb567c7e6221ac'

    // Update admin user's Pixabay API key
    const admin = await prisma.user.update({
      where: { email: adminEmail },
      data: { pixabayApiKey: pixabayKey }
    })

    console.log('Pixabay API Key updated for user:', adminEmail)
    console.log('API Key set:', pixabayKey.substring(0, 10) + '...')
    
    return admin
  } catch (error) {
    console.error('Error updating Pixabay API key:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updatePixabayKey()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))