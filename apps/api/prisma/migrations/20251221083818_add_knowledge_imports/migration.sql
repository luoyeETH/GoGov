-- CreateTable
CREATE TABLE "KnowledgeImport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "topics" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeImport_userId_createdAt_idx" ON "KnowledgeImport"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "KnowledgeImport" ADD CONSTRAINT "KnowledgeImport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
