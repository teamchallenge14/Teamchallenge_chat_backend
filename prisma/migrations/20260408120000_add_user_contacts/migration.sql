-- AlterTable
ALTER TABLE "UserData"
ADD COLUMN "allowContactSave" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "UserContact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "contactUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserContact_tenantId_ownerUserId_contactUserId_key"
ON "UserContact"("tenantId", "ownerUserId", "contactUserId");

-- CreateIndex
CREATE INDEX "UserContact_tenantId_ownerUserId_createdAt_idx"
ON "UserContact"("tenantId", "ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "UserContact_tenantId_contactUserId_idx"
ON "UserContact"("tenantId", "contactUserId");

-- AddForeignKey
ALTER TABLE "UserContact"
ADD CONSTRAINT "UserContact_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContact"
ADD CONSTRAINT "UserContact_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContact"
ADD CONSTRAINT "UserContact_contactUserId_fkey"
FOREIGN KEY ("contactUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
