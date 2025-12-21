-- CreateTable
CREATE TABLE "FreeAiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeAiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FreeAiUsage_userId_date_key" ON "FreeAiUsage"("userId", "date");

-- CreateIndex
CREATE INDEX "FreeAiUsage_userId_date_idx" ON "FreeAiUsage"("userId", "date");

-- AddForeignKey
ALTER TABLE "FreeAiUsage" ADD CONSTRAINT "FreeAiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
