/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AuthProvider" ADD VALUE 'GUEST';

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_name_key" ON "Tenant"("name");
