-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "preferencesJson" TEXT NOT NULL,
    "primaryNiche" TEXT NOT NULL DEFAULT 'tech',
    "nicheKeywords" TEXT NOT NULL,
    "avoidKeywords" TEXT NOT NULL,
    "noFace" BOOLEAN NOT NULL DEFAULT false,
    "effortLevel" TEXT NOT NULL DEFAULT 'med',
    "region" TEXT
);

-- CreateTable
CREATE TABLE "TrendSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'apify',
    "videoCount" INTEGER NOT NULL,
    "hashtagCount" INTEGER NOT NULL,
    "userProfileId" TEXT,
    CONSTRAINT "TrendSnapshot_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrendVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "hashtags" TEXT NOT NULL,
    "authorName" TEXT,
    "authorId" TEXT,
    "views" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "createdAtSource" DATETIME,
    "rawJson" TEXT NOT NULL,
    CONSTRAINT "TrendVideo_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "TrendSnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrendHashtag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "hashtag" TEXT NOT NULL,
    "rank" INTEGER,
    "views" INTEGER,
    "rawJson" TEXT NOT NULL,
    CONSTRAINT "TrendHashtag_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "TrendSnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
