-- AlterTable
ALTER TABLE "Photo"
ADD COLUMN     "storageProvider" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "fileSize" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Photo_checksum_key" ON "Photo"("checksum");
