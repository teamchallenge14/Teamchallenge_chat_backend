/*
  Warnings:

  - A unique constraint covering the columns `[userId,provider]` on the table `AuthMethod` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AuthMethod_userId_provider_key" ON "AuthMethod"("userId", "provider");
