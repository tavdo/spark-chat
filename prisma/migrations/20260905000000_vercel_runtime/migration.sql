-- AlterTable
ALTER TABLE "Chat" ADD COLUMN "lastSeenA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Chat" ADD COLUMN "lastSeenB" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Chat" ADD COLUMN "typingA" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Chat" ADD COLUMN "typingB" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MatchQueue" (
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchQueue_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "MatchQueue_createdAt_idx" ON "MatchQueue"("createdAt");

-- AddForeignKey
ALTER TABLE "MatchQueue" ADD CONSTRAINT "MatchQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
