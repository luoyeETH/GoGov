-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('behavioral', 'technical', 'situational', 'competency', 'mixed');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('in_progress', 'completed', 'abandoned');

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InterviewType" NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'in_progress',
    "title" TEXT,
    "targetRole" TEXT,
    "difficulty" INTEGER DEFAULT 2,
    "totalQuestions" INTEGER,
    "overallScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "feedbackJson" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionAudioUrl" TEXT,
    "questionContext" TEXT,
    "answerText" TEXT,
    "answerAudioUrl" TEXT,
    "answerDurationMs" INTEGER,
    "score" DOUBLE PRECISION,
    "analysis" TEXT,
    "analysisJson" JSONB,
    "metrics" JSONB,
    "suggestedAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewTurn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewSession_userId_createdAt_idx" ON "InterviewSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InterviewSession_userId_type_idx" ON "InterviewSession"("userId", "type");

-- CreateIndex
CREATE INDEX "InterviewSession_userId_status_idx" ON "InterviewSession"("userId", "status");

-- CreateIndex
CREATE INDEX "InterviewTurn_sessionId_idx" ON "InterviewTurn"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewTurn_sessionId_turnNumber_key" ON "InterviewTurn"("sessionId", "turnNumber");

-- CreateIndex
CREATE INDEX "InterviewTurn_sessionId_turnNumber_idx" ON "InterviewTurn"("sessionId", "turnNumber");

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewTurn" ADD CONSTRAINT "InterviewTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
