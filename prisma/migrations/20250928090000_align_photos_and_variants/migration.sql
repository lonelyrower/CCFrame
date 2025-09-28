-- Align photos table with Prisma schema
ALTER TABLE "photos"
  ADD COLUMN IF NOT EXISTS "url" TEXT,
  ADD COLUMN IF NOT EXISTS "local_path" TEXT,
  ADD COLUMN IF NOT EXISTS "original_file_name" TEXT,
  ADD COLUMN IF NOT EXISTS "aspect_ratio" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "blur_hash_data_url" TEXT,
  ADD COLUMN IF NOT EXISTS "extracted_coordinates" JSONB,
  ADD COLUMN IF NOT EXISTS "dominant_color" TEXT;

-- Ensure status default matches Prisma model
ALTER TABLE "photos"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Align photo_variants table with Prisma schema
ALTER TABLE "photo_variants"
  ADD COLUMN IF NOT EXISTS "url" TEXT,
  ADD COLUMN IF NOT EXISTS "local_path" TEXT;
