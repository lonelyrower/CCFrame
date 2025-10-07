import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { existsSync } from 'fs';

export interface UploadResult {
  fileKey: string;
  ext: string;
  width: number;
  height: number;
  size: number;
  dominantColor?: string;
}

/**
 * Save uploaded file to disk
 */
export async function saveUploadedFile(
  file: File,
  fileName: string,
  isPublic: boolean = true
): Promise<UploadResult> {
  // Get file buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Get current date for folder structure
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Create upload directory path based on isPublic
  // Public files: public/uploads/... (accessible via CDN)
  // Private files: private/uploads/... (accessible only via API)
  const baseDir = isPublic ? 'public' : 'private';
  const uploadDir = join(process.cwd(), baseDir, 'uploads', 'original', String(year), month);

  // Ensure directory exists
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Get file extension
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';

  // Generate unique filename
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const filePath = join(uploadDir, uniqueName);

  // Get image metadata using sharp
  const metadata = await sharp(buffer).metadata();

  // Save original file
  await writeFile(filePath, buffer);

  // Generate thumbnail (optional, for future use)
  const thumbDir = join(process.cwd(), baseDir, 'uploads', 'thumbs', String(year), month);
  if (!existsSync(thumbDir)) {
    await mkdir(thumbDir, { recursive: true });
  }

  const thumbPath = join(thumbDir, uniqueName);
  await sharp(buffer)
    .resize(400, 400, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toFile(thumbPath);

  // Compute dominant color on server (best-effort)
  let dominantColor: string | undefined;
  try {
    const stats = await sharp(buffer).stats();
    // Prefer sharp's dominant swatch if available
    if ((stats as any).dominant) {
      const { r, g, b } = (stats as any).dominant as { r: number; g: number; b: number };
      dominantColor = `#${r.toString(16).padStart(2, '0')}${g
        .toString(16)
        .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } else if (stats.channels && stats.channels.length >= 3) {
      // Fallback: average across channels
      const [red, green, blue] = stats.channels;
      const r = Math.round(red.mean);
      const g = Math.round(green.mean);
      const b = Math.round(blue.mean);
      dominantColor = `#${r.toString(16).padStart(2, '0')}${g
        .toString(16)
        .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  } catch {
    // Ignore color extraction errors; continue without blocking upload
  }

  // Return file info
  // For public files, omit the 'public/' prefix since Next.js serves them from root
  // For private files, keep the full path for API routing
  const fileKey = isPublic
    ? `uploads/original/${year}/${month}/${uniqueName}`
    : `${baseDir}/uploads/original/${year}/${month}/${uniqueName}`;

  return {
    fileKey,
    ext,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: buffer.length,
    dominantColor,
  };
}

/**
 * Extract EXIF data from image
 */
export async function extractExifData(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      exif: metadata.exif,
    };
  } catch (error) {
    console.error('Error extracting EXIF:', error);
    return null;
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: 50MB`,
    };
  }

  return { valid: true };
}
