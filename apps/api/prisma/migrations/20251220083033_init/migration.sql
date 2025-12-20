/*
  Warnings:

  - You are about to drop the `EmailLoginToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'hidden');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "examStartDate" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender" DEFAULT 'hidden',
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "username" TEXT;

-- DropTable
DROP TABLE "EmailLoginToken";

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
