-- V1__initial_schema.sql: Initial Schema Migration for Immersio PostgreSQL DB

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Username" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(256) NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "Role" TEXT NOT NULL DEFAULT 'Student',
    "SubscriptionTier" VARCHAR(50) NOT NULL DEFAULT 'Basic',
    "SubscriptionExpiresAt" TIMESTAMP WITHOUT TIME ZONE NULL,
    "StreakCount" INT NOT NULL DEFAULT 0,
    "ExperiencePoints" INT NOT NULL DEFAULT 0,
    "LearningHours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "CurrentLanguageLevel" VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
    "NotifEmail" BOOLEAN NOT NULL DEFAULT TRUE,
    "NotifPush" BOOLEAN NOT NULL DEFAULT TRUE,
    "NotifStreak" BOOLEAN NOT NULL DEFAULT TRUE,
    "NotifTips" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsPublic" BOOLEAN NOT NULL DEFAULT TRUE,
    "ProfilePictureUrl" TEXT NULL,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "UpdatedAt" TIMESTAMP WITHOUT TIME ZONE NULL,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Username" ON "Users" ("Username");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");

-- 2. RefreshTokens
CREATE TABLE IF NOT EXISTS "RefreshTokens" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Token" VARCHAR(512) NOT NULL,
    "UserId" UUID NOT NULL REFERENCES "Users" ("Id") ON DELETE CASCADE,
    "ExpiresAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "RevokedAt" TIMESTAMP WITHOUT TIME ZONE NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_RefreshTokens_Token" ON "RefreshTokens" ("Token");
CREATE INDEX IF NOT EXISTS "IX_RefreshTokens_UserId" ON "RefreshTokens" ("UserId");

-- 3. PasswordResetCodes
CREATE TABLE IF NOT EXISTS "PasswordResetCodes" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Email" VARCHAR(256) NOT NULL,
    "CodeHash" TEXT NOT NULL,
    "ExpiresAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "UsedAt" TIMESTAMP WITHOUT TIME ZONE NULL,
    "AttemptCount" INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "IX_PasswordResetCodes_Email" ON "PasswordResetCodes" ("Email");

-- 4. Decks
CREATE TABLE IF NOT EXISTS "Decks" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(150) NOT NULL,
    "UserId" UUID NOT NULL REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS "IX_Decks_UserId" ON "Decks" ("UserId");

-- 5. Cards
CREATE TABLE IF NOT EXISTS "Cards" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "DeckId" UUID NOT NULL REFERENCES "Decks" ("Id") ON DELETE CASCADE,
    "Front" VARCHAR(1000) NOT NULL,
    "Back" VARCHAR(2000) NOT NULL,
    "Explanation" VARCHAR(4000) NULL,
    "Tag" VARCHAR(100) NULL,
    "Repetitions" INT NOT NULL DEFAULT 0,
    "EasinessFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "IntervalDays" INT NOT NULL DEFAULT 0,
    "NextReviewDate" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "LastReviewedAt" TIMESTAMP WITHOUT TIME ZONE NULL,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS "IX_Cards_DeckId_NextReviewDate_IsDeleted" ON "Cards" ("DeckId", "NextReviewDate", "IsDeleted");

-- 6. Scenarios
CREATE TABLE IF NOT EXISTS "Scenarios" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Title" VARCHAR(200) NOT NULL,
    "Language" VARCHAR(50) NOT NULL,
    "Level" VARCHAR(50) NOT NULL,
    "Category" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(1000) NOT NULL,
    "Rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "Duration" VARCHAR(50) NOT NULL,
    "ImageUrl" VARCHAR(1000) NOT NULL,
    "ContextPrompt" VARCHAR(4000) NOT NULL,
    "InitialMessage" VARCHAR(1000) NOT NULL,
    "AvatarUrl" VARCHAR(1000) NOT NULL,
    "IsNavigation" BOOLEAN NOT NULL DEFAULT FALSE,
    "VoiceId" VARCHAR(100) NULL,
    "EmotionsJson" VARCHAR(2000) NULL,
    "Gender" TEXT NULL,
    "DefaultEmotion" TEXT NULL,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. ScenarioItems
CREATE TABLE IF NOT EXISTS "ScenarioItems" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ScenarioId" UUID NOT NULL REFERENCES "Scenarios" ("Id") ON DELETE CASCADE,
    "Name" VARCHAR(150) NOT NULL,
    "Price" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    "ImageUrl" VARCHAR(1000) NOT NULL,
    "Icon" VARCHAR(50) NULL
);

CREATE INDEX IF NOT EXISTS "IX_ScenarioItems_ScenarioId" ON "ScenarioItems" ("ScenarioId");

-- 8. ScenarioSessions
CREATE TABLE IF NOT EXISTS "ScenarioSessions" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" UUID NOT NULL REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    "ScenarioId" UUID NOT NULL REFERENCES "Scenarios" ("Id") ON DELETE RESTRICT,
    "StartedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "FinishedAt" TIMESTAMP WITHOUT TIME ZONE NULL,
    "Feedback" VARCHAR(4000) NULL,
    "IsFinished" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS "IX_ScenarioSessions_UserId" ON "ScenarioSessions" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_ScenarioSessions_ScenarioId" ON "ScenarioSessions" ("ScenarioId");

-- 9. SessionMessages
CREATE TABLE IF NOT EXISTS "SessionMessages" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SessionId" UUID NOT NULL REFERENCES "ScenarioSessions" ("Id") ON DELETE CASCADE,
    "SenderRole" VARCHAR(50) NOT NULL,
    "Text" VARCHAR(4000) NOT NULL,
    "SentAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "CorrectionText" VARCHAR(4000) NULL,
    "CorrectionExplanation" VARCHAR(4000) NULL
);

CREATE INDEX IF NOT EXISTS "IX_SessionMessages_SessionId_SentAt" ON "SessionMessages" ("SessionId", "SentAt");

-- 10. UserPronunciationLogs
CREATE TABLE IF NOT EXISTS "UserPronunciationLogs" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" UUID NOT NULL REFERENCES "Users" ("Id") ON DELETE CASCADE,
    "Phrase" VARCHAR(2000) NOT NULL,
    "Transcript" VARCHAR(2000) NOT NULL,
    "Score" INT NOT NULL DEFAULT 0,
    "PracticedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS "IX_UserPronunciationLogs_UserId" ON "UserPronunciationLogs" ("UserId");

-- 11. PaymentTransactions
CREATE TABLE IF NOT EXISTS "PaymentTransactions" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TxnRef" VARCHAR(100) NOT NULL,
    "UserId" UUID NOT NULL REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    "Tier" VARCHAR(50) NOT NULL,
    "BillingCycle" VARCHAR(20) NOT NULL,
    "Amount" BIGINT NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "VnpTransactionNo" VARCHAR(100) NULL,
    "ResponseCode" VARCHAR(10) NULL,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "PaidAt" TIMESTAMP WITHOUT TIME ZONE NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_PaymentTransactions_TxnRef" ON "PaymentTransactions" ("TxnRef");
CREATE INDEX IF NOT EXISTS "IX_PaymentTransactions_UserId" ON "PaymentTransactions" ("UserId");

-- 12. SystemSettings
CREATE TABLE IF NOT EXISTS "SystemSettings" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Key" TEXT NOT NULL,
    "Value" TEXT NOT NULL,
    "UpdatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
