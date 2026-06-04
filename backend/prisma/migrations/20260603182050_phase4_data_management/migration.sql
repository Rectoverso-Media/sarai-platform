/*
  Warnings:

  - You are about to drop the column `sqlTemplate` on the `ApiQuery` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ApiQuery_endpointUrl_key";

-- AlterTable
ALTER TABLE "ApiQuery" DROP COLUMN "sqlTemplate",
ADD COLUMN     "authConfig" JSONB,
ADD COLUMN     "authType" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "bodyTemplate" JSONB,
ADD COLUMN     "headers" JSONB,
ADD COLUMN     "responseMapping" JSONB;

-- AlterTable
ALTER TABLE "ApiQueryExecution" ADD COLUMN     "responseSnapshot" JSONB;

-- AlterTable
ALTER TABLE "ManagedTable" ADD COLUMN     "columns" JSONB;

-- AlterTable
ALTER TABLE "WarehouseData" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "WarehouseTable" ADD COLUMN     "retentionDays" INTEGER;

-- AddForeignKey
ALTER TABLE "WarehouseData" ADD CONSTRAINT "WarehouseData_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "WarehouseTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
