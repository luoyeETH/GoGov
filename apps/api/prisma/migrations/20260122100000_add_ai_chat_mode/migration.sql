-- AlterTable
ALTER TABLE "AiChatMessage" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'planner';

-- CreateIndex
CREATE INDEX "AiChatMessage_userId_mode_createdAt_idx" ON "AiChatMessage"("userId", "mode", "createdAt");
