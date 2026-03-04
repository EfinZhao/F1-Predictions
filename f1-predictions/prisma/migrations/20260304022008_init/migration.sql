-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "favoriteTeam" TEXT,
    "favoriteDriver" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "raceName" TEXT NOT NULL,
    "driver1" TEXT,
    "driver2" TEXT,
    "driver3" TEXT,
    "driver4" TEXT,
    "driver5" TEXT,
    "pole" TEXT,
    "team1" TEXT,
    "team2" TEXT,
    "team3" TEXT,
    "fastestLap" TEXT,
    "points" INTEGER,
    "scoreBreakdown" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RaceResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceName" TEXT NOT NULL,
    "driver1" TEXT,
    "driver2" TEXT,
    "driver3" TEXT,
    "driver4" TEXT,
    "driver5" TEXT,
    "pole" TEXT,
    "team1" TEXT,
    "team2" TEXT,
    "team3" TEXT,
    "fastestLap" TEXT,
    "scoringDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_raceName_key" ON "Prediction"("userId", "raceName");

-- CreateIndex
CREATE UNIQUE INDEX "RaceResult_raceName_key" ON "RaceResult"("raceName");
