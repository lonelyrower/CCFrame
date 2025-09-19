-- AlterTable
ALTER TABLE "faces" ADD COLUMN     "embedding" BYTEA;

-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "auto_tag_daily_limit" INTEGER,
ADD COLUMN     "auto_tag_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "auto_tag_include_colors" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "auto_tag_include_content" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "auto_tag_provider" TEXT,
ADD COLUMN     "auto_tag_usage_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auto_tag_usage_date" TEXT,
ADD COLUMN     "clipdrop_api_key" TEXT,
ADD COLUMN     "google_api_key" TEXT,
ADD COLUMN     "openai_api_key" TEXT,
ADD COLUMN     "remove_bg_api_key" TEXT;

-- CreateTable
CREATE TABLE "photo_embeddings" (
    "photo_id" TEXT NOT NULL,
    "embedding" BYTEA NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'deterministic',
    "provider" TEXT NOT NULL DEFAULT 'deterministic',
    "dim" INTEGER NOT NULL DEFAULT 768,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_embeddings_pkey" PRIMARY KEY ("photo_id")
);

-- AddForeignKey
ALTER TABLE "photo_embeddings" ADD CONSTRAINT "photo_embeddings_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

