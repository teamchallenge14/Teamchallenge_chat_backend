-- AlterTable
ALTER TABLE "UserData" ADD COLUMN     "language" "RoomLanguage";

-- CreateTable
CREATE TABLE "RandomMatchPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "genders" "Gender"[] DEFAULT ARRAY[]::"Gender"[],
    "languages" "RoomLanguage"[] DEFAULT ARRAY[]::"RoomLanguage"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RandomMatchPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RandomMatchPreferenceInterest" (
    "preferenceId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,

    CONSTRAINT "RandomMatchPreferenceInterest_pkey" PRIMARY KEY ("preferenceId","interestId")
);

-- CreateIndex
CREATE UNIQUE INDEX "RandomMatchPreference_userId_key" ON "RandomMatchPreference"("userId");

-- AddForeignKey
ALTER TABLE "RandomMatchPreference" ADD CONSTRAINT "RandomMatchPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomMatchPreferenceInterest" ADD CONSTRAINT "RandomMatchPreferenceInterest_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "RandomMatchPreference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomMatchPreferenceInterest" ADD CONSTRAINT "RandomMatchPreferenceInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
