-- CreateTable
CREATE TABLE "SharedSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "timerMode" TEXT NOT NULL DEFAULT 'focus',
    "duration" INTEGER NOT NULL DEFAULT 1500,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "inviteCode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedSession_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharedSessionParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedSessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SharedSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SharedSessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedSession_inviteCode_key" ON "SharedSession"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "SharedSessionParticipant_sessionId_userId_key" ON "SharedSessionParticipant"("sessionId", "userId");
