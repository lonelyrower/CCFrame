/**
 * Migration script to fix fileKey values in database
 * Removes 'public/' prefix from fileKey values that start with 'public/uploads/'
 *
 * Run with: npx tsx scripts/fix-filekey-prefix.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting fileKey migration...');

  // Find all photos with fileKey starting with 'public/'
  const photosToFix = await prisma.photo.findMany({
    where: {
      fileKey: {
        startsWith: 'public/',
      },
    },
  });

  console.log(`Found ${photosToFix.length} photos to fix`);

  if (photosToFix.length === 0) {
    console.log('No photos to fix. Migration complete.');
    return;
  }

  // Update each photo
  let updated = 0;
  for (const photo of photosToFix) {
    const oldFileKey = photo.fileKey;
    // Remove 'public/' prefix
    const newFileKey = oldFileKey.replace(/^public\//, '');

    await prisma.photo.update({
      where: { id: photo.id },
      data: { fileKey: newFileKey },
    });

    console.log(`Updated photo ${photo.id}: ${oldFileKey} -> ${newFileKey}`);
    updated++;
  }

  console.log(`\nMigration complete! Updated ${updated} photos.`);
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
