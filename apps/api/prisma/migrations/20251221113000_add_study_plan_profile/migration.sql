-- CreateTable
CREATE TABLE "StudyPlanProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prepStartDate" TIMESTAMP(3),
    "totalStudyHours" DOUBLE PRECISION,
    "currentProgress" TEXT,
    "targetExam" TEXT,
    "targetExamDate" TIMESTAMP(3),
    "plannedMaterials" TEXT,
    "interviewExperience" BOOLEAN,
    "learningGoals" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlanProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudyPlanProfile_userId_key" ON "StudyPlanProfile"("userId");

-- CreateIndex
CREATE INDEX "StudyPlanProfile_userId_updatedAt_idx" ON "StudyPlanProfile"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "StudyPlanProfile" ADD CONSTRAINT "StudyPlanProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
