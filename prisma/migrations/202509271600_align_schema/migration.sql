-- Align users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_seed_count" INTEGER DEFAULT 12;

-- Align photos table
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "file_key" TEXT;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "hash" TEXT;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "local_path" TEXT;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "original_file_name" TEXT;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "aspect_ratio" DOUBLE PRECISION;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "taken_at" TIMESTAMP(3);
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "blur_hash_data_url" TEXT;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "blurhash" TEXT;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "extracted_coordinates" JSONB;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "dominant_color" TEXT;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "exif_json" JSONB;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "location" JSONB;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "content_hash" TEXT;

CREATE INDEX IF NOT EXISTS "photos_user_id_idx" ON "photos"("user_id");
CREATE INDEX IF NOT EXISTS "photos_album_id_idx" ON "photos"("album_id");
CREATE INDEX IF NOT EXISTS "photos_visibility_idx" ON "photos"("visibility");
CREATE INDEX IF NOT EXISTS "photos_status_idx" ON "photos"("status");
CREATE INDEX IF NOT EXISTS "photos_hash_idx" ON "photos"("hash");
CREATE INDEX IF NOT EXISTS "photos_content_hash_idx" ON "photos"("content_hash");
CREATE INDEX IF NOT EXISTS "photos_taken_at_idx" ON "photos"("taken_at");

-- Align photo_variants table
ALTER TABLE "photo_variants" ADD COLUMN IF NOT EXISTS "local_path" TEXT;
ALTER TABLE "photo_variants" ADD COLUMN IF NOT EXISTS "file_key" TEXT;
ALTER TABLE "photo_variants" ADD COLUMN IF NOT EXISTS "size_bytes" INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS "photo_variants_photo_id_variant_format_key" ON "photo_variants"("photo_id","variant","format");

-- Create photo_notes table
CREATE TABLE IF NOT EXISTS "photo_notes" (
  "id" TEXT PRIMARY KEY,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "photo_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  CONSTRAINT "photo_notes_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "photo_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create user_photo_favorites table
CREATE TABLE IF NOT EXISTS "user_photo_favorites" (
  "user_id" TEXT NOT NULL,
  "photo_id" TEXT NOT NULL,
  CONSTRAINT "user_photo_favorites_pkey" PRIMARY KEY ("user_id", "photo_id"),
  CONSTRAINT "user_photo_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_photo_favorites_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Smart albums rule JSON
ALTER TABLE "smart_albums" ADD COLUMN IF NOT EXISTS "rule_json" JSONB;

-- App settings table
CREATE TABLE IF NOT EXISTS "app_settings" (
  "id" TEXT PRIMARY KEY DEFAULT 'singleton',
  "openai_api_key" TEXT,
  "google_api_key" TEXT,
  "clipdrop_api_key" TEXT,
  "remove_bg_api_key" TEXT,
  "image_formats" TEXT,
  "image_variant_names" TEXT,
  "auto_tag_enabled" BOOLEAN NOT NULL DEFAULT false,
  "auto_tag_include_colors" BOOLEAN NOT NULL DEFAULT true,
  "auto_tag_include_content" BOOLEAN NOT NULL DEFAULT true,
  "auto_tag_provider" TEXT,
  "auto_tag_daily_limit" INTEGER,
  "auto_tag_usage_date" TEXT,
  "auto_tag_usage_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Photo embeddings table
CREATE TABLE IF NOT EXISTS "photo_embeddings" (
  "photo_id" TEXT PRIMARY KEY,
  "embedding" BYTEA NOT NULL,
  "model" TEXT NOT NULL DEFAULT 'deterministic',
  "provider" TEXT NOT NULL DEFAULT 'deterministic',
  "dim" INTEGER NOT NULL DEFAULT 768,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "photo_embeddings_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Faces table
CREATE TABLE IF NOT EXISTS "faces" (
  "id" TEXT PRIMARY KEY,
  "bbox" TEXT NOT NULL,
  "person_id" TEXT,
  "embedding" BYTEA,
  "photo_id" TEXT NOT NULL,
  CONSTRAINT "faces_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Edit versions table
CREATE TABLE IF NOT EXISTS "edit_versions" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "file_key" TEXT NOT NULL,
  "params" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "photo_id" TEXT NOT NULL,
  CONSTRAINT "edit_versions_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Jobs table alignment
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "payload_json" JSONB;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "result_json" JSONB;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "error_msg" TEXT;

-- Audits table alignment
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "target_type" TEXT;
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "target_id" TEXT;
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "meta" JSONB;
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
ALTER TABLE "audits" ADD CONSTRAINT IF NOT EXISTS "audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
