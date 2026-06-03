-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT,
ADD COLUMN     "twoFactorTempToken" TEXT;

-- CreateTable
CREATE TABLE "synced_data" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "streamName" TEXT NOT NULL,
    "recordData" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "abGenerationId" INTEGER,

    CONSTRAINT "synced_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthToken" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "synced_data_connectionId_idx" ON "synced_data"("connectionId");

-- CreateIndex
CREATE INDEX "synced_data_streamName_idx" ON "synced_data"("streamName");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken_dataSourceId_key" ON "OAuthToken"("dataSourceId");

-- AddForeignKey
ALTER TABLE "synced_data" ADD CONSTRAINT "synced_data_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthToken" ADD CONSTRAINT "OAuthToken_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
