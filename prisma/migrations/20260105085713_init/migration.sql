/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `AuthMethod` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[login]` on the table `AuthMethod` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AuthMethod_email_key" ON "AuthMethod"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthMethod_login_key" ON "AuthMethod"("login");
