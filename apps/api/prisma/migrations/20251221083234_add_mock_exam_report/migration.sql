-- CreateTable
CREATE TABLE "MockExamReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "note" TEXT,
    "metrics" JSONB,
    "analysis" JSONB,
    "analysisRaw" TEXT,
    "overallAccuracy" DOUBLE PRECISION,
    "timeTotalMinutes" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockExamReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MockExamReport_userId_createdAt_idx" ON "MockExamReport"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "MockExamReport" ADD CONSTRAINT "MockExamReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
