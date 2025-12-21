-- CreateTable
CREATE TABLE "StudyPlanDailyTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planHistoryId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "adjustNote" TEXT,
    "tasks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlanDailyTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudyPlanDailyTask_userId_date_key" ON "StudyPlanDailyTask"("userId", "date");

-- CreateIndex
CREATE INDEX "StudyPlanDailyTask_userId_date_idx" ON "StudyPlanDailyTask"("userId", "date");

-- AddForeignKey
ALTER TABLE "StudyPlanDailyTask" ADD CONSTRAINT "StudyPlanDailyTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanDailyTask" ADD CONSTRAINT "StudyPlanDailyTask_planHistoryId_fkey" FOREIGN KEY ("planHistoryId") REFERENCES "StudyPlanHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
