/*
  Warnings:

  - You are about to drop the column `secondName` on the `UserData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserData" DROP COLUMN "secondName",
ADD COLUMN     "lastName" VARCHAR(20);
