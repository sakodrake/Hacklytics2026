-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "preferencesJson" TEXT NOT NULL,
    "primaryNiche" TEXT NOT NULL DEFAULT 'tech',
    "nicheKeywords" TEXT NOT NULL,
    "avoidKeywords" TEXT NOT NULL,
    "noFace" BOOLEAN NOT NULL DEFAULT false,
    "effortLevel" TEXT NOT NULL DEFAULT 'med',
    "videoLength" INTEGER NOT NULL DEFAULT 30,
    "region" TEXT
);
INSERT INTO "new_UserProfile" ("avoidKeywords", "createdAt", "effortLevel", "id", "nicheKeywords", "noFace", "preferencesJson", "primaryNiche", "region", "updatedAt") SELECT "avoidKeywords", "createdAt", "effortLevel", "id", "nicheKeywords", "noFace", "preferencesJson", "primaryNiche", "region", "updatedAt" FROM "UserProfile";
DROP TABLE "UserProfile";
ALTER TABLE "new_UserProfile" RENAME TO "UserProfile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
