-- CreateEnum
CREATE TYPE "CustomTaskRecurrenceType" AS ENUM ('once', 'daily', 'weekly', 'interval');

-- CreateTable
CREATE TABLE "CustomTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "recurrenceType" "CustomTaskRecurrenceType" NOT NULL,
    "intervalDays" INTEGER,
    "weekdays" INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomTaskCompletion" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomTaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomTask_userId_createdAt_idx" ON "CustomTask"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomTask_userId_isActive_idx" ON "CustomTask"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CustomTaskCompletion_taskId_date_key" ON "CustomTaskCompletion"("taskId", "date");

-- CreateIndex
CREATE INDEX "CustomTaskCompletion_userId_date_idx" ON "CustomTaskCompletion"("userId", "date");

-- AddForeignKey
ALTER TABLE "CustomTask" ADD CONSTRAINT "CustomTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomTaskCompletion" ADD CONSTRAINT "CustomTaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CustomTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomTaskCompletion" ADD CONSTRAINT "CustomTaskCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
