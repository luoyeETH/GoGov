-- CreateTable
CREATE TABLE "KlineReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bazi" JSONB,
    "input" JSONB,
    "analysis" JSONB,
    "raw" TEXT,
    "model" TEXT,
    "warning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KlineReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KlineReport_userId_createdAt_idx" ON "KlineReport"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "KlineReport" ADD CONSTRAINT "KlineReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
