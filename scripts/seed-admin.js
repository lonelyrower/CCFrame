const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: ADMIN_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create admin user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  console.log(`✓ Admin user created: ${user.email}`);

  // Initialize SiteCopy with default value
  await prisma.siteCopy.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      homeCopy: null, // Will use default from constants
    },
  });

  console.log('✓ SiteCopy initialized');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
