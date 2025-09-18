ALTER TABLE "photos" DROP CONSTRAINT IF EXISTS "photos_user_id_content_hash_key";
WITH duplicates AS (
  SELECT id, user_id, content_hash, ROW_NUMBER() OVER (PARTITION BY user_id, content_hash ORDER BY created_at) AS rn
  FROM photos
  WHERE content_hash IS NOT NULL
)
DELETE FROM photos WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
ALTER TABLE "photos" ADD CONSTRAINT "photos_user_id_content_hash_key" UNIQUE ("user_id", "content_hash");
