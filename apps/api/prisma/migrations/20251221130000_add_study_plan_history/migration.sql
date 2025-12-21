-- CreateTable
CREATE TABLE "StudyPlanHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summary" TEXT,
    "progressUpdate" TEXT,
    "followUpAnswers" TEXT,
    "profileSnapshot" JSONB,
    "preferences" JSONB,
    "planData" JSONB,
    "planRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyPlanHistory_userId_createdAt_idx" ON "StudyPlanHistory"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "StudyPlanHistory" ADD CONSTRAINT "StudyPlanHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
