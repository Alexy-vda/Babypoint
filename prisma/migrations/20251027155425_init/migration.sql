-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('ONE_V_ONE', 'TWO_V_TWO');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_memberships" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,

    CONSTRAINT "league_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "type" "MatchType" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "scoreTeamA" INTEGER NOT NULL DEFAULT 0,
    "scoreTeamB" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leagueId" TEXT NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_players" (
    "id" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elo_ratings" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1000,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "matchesLost" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,

    CONSTRAINT "elo_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elo_changes" (
    "id" TEXT NOT NULL,
    "ratingBefore" INTEGER NOT NULL,
    "ratingAfter" INTEGER NOT NULL,
    "change" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eloRatingId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,

    CONSTRAINT "elo_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_inviteCode_key" ON "leagues"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "league_memberships_userId_leagueId_key" ON "league_memberships"("userId", "leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "match_players_matchId_userId_key" ON "match_players"("matchId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "elo_ratings_userId_leagueId_key" ON "elo_ratings"("userId", "leagueId");

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_memberships" ADD CONSTRAINT "league_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_memberships" ADD CONSTRAINT "league_memberships_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elo_ratings" ADD CONSTRAINT "elo_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elo_ratings" ADD CONSTRAINT "elo_ratings_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elo_changes" ADD CONSTRAINT "elo_changes_eloRatingId_fkey" FOREIGN KEY ("eloRatingId") REFERENCES "elo_ratings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elo_changes" ADD CONSTRAINT "elo_changes_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
