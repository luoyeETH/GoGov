-- CreateTable
CREATE TABLE "GlobalFreeAiUsage" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalFreeAiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalFreeAiUsage_date_key" ON "GlobalFreeAiUsage"("date");

-- CreateIndex
CREATE INDEX "GlobalFreeAiUsage_date_idx" ON "GlobalFreeAiUsage"("date");
