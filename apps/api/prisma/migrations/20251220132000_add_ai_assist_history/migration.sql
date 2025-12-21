-- CreateTable
CREATE TABLE "AiAssistHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAssistHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiAssistHistory_userId_createdAt_idx" ON "AiAssistHistory"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiAssistHistory" ADD CONSTRAINT "AiAssistHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
