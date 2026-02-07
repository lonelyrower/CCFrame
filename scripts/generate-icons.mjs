import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const jobs = [
  // PWA icons
  { input: 'public/logo.svg', output: 'public/icons/icon-192.png', size: 192 },
  { input: 'public/logo.svg', output: 'public/icons/icon-512.png', size: 512 },
  { input: 'public/icons/icon-maskable.svg', output: 'public/icons/icon-maskable-192.png', size: 192 },
  { input: 'public/icons/icon-maskable.svg', output: 'public/icons/icon-maskable-512.png', size: 512 },

  // iOS A2HS
  { input: 'public/apple-touch-icon.svg', output: 'public/apple-touch-icon.png', size: 180 },

  // Manifest shortcut icons
  { input: 'public/icons/photos.svg', output: 'public/icons/photos.png', size: 96 },
  { input: 'public/icons/admin.svg', output: 'public/icons/admin.png', size: 96 },
];

await Promise.all(
  jobs.map(async ({ input, output, size }) => {
    await mkdir(path.dirname(output), { recursive: true });
    await sharp(input).resize(size, size).png({ compressionLevel: 9 }).toFile(output);
    process.stdout.write(`generated ${output}\n`);
  })
);

