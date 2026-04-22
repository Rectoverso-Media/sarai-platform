-- CreateTable
CREATE TABLE "InfrastructureNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Online',
    "uptime" TEXT NOT NULL DEFAULT '0d 0h',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfrastructureNode_pkey" PRIMARY KEY ("id")
);
