-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "RoomMemberRole" ADD VALUE 'ADMIN';

-- CreateTable
CREATE TABLE "RoomJoinRequest" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "RoomJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomJoinRequest_roomId_status_idx" ON "RoomJoinRequest"("roomId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RoomJoinRequest_roomId_userId_key" ON "RoomJoinRequest"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "RoomJoinRequest" ADD CONSTRAINT "RoomJoinRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomJoinRequest" ADD CONSTRAINT "RoomJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
