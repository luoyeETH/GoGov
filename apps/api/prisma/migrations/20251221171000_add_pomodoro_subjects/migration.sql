-- CreateTable
CREATE TABLE "PomodoroSubject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PomodoroSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PomodoroSubject_userId_name_key" ON "PomodoroSubject"("userId", "name");

-- CreateIndex
CREATE INDEX "PomodoroSubject_userId_createdAt_idx" ON "PomodoroSubject"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PomodoroSubject" ADD CONSTRAINT "PomodoroSubject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
