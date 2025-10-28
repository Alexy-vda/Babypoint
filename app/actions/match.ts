"use server";

/**
 * Server Actions pour les matchs
 * Remplace les API routes pour les mutations
 * Avantages: Moins de code, typage automatique, Progressive Enhancement
 */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserFromCookies } from "@/lib/auth-server";
import type { MatchType } from "@/types/api";

type Team = "TEAM_A" | "TEAM_B";

export async function createMatch(formData: FormData) {
  const user = await getUserFromCookies();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const leagueId = formData.get("leagueId") as string;
  const type = formData.get("type") as MatchType;
  const teamAJson = formData.get("teamA") as string;
  const teamBJson = formData.get("teamB") as string;

  const teamA = JSON.parse(teamAJson);
  const teamB = JSON.parse(teamBJson);

  try {
    // Vérifier que l'utilisateur est membre de la ligue
    const membership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: user.userId,
          leagueId,
        },
      },
    });

    if (!membership) {
      return { error: "Accès refusé" };
    }

    // Créer le match
    const match = await prisma.match.create({
      data: {
        leagueId,
        type,
        status: "IN_PROGRESS",
        scoreTeamA: 0,
        scoreTeamB: 0,
        startedAt: new Date(),
        players: {
          create: [
            ...teamA.map((userId: string) => ({
              userId,
              team: "TEAM_A" as const,
            })),
            ...teamB.map((userId: string) => ({
              userId,
              team: "TEAM_B" as const,
            })),
          ],
        },
      },
    });

    revalidatePath(`/leagues/${leagueId}`);

    return { success: true, matchId: match.id };
  } catch (error) {
    console.error("Erreur création match:", error);
    return { error: "Erreur lors de la création du match" };
  }
}

export async function finishMatch(
  matchId: string,
  scoreTeamA: number,
  scoreTeamB: number
) {
  const user = await getUserFromCookies();

  if (!user) {
    return { error: "Non authentifié" };
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { league: true, players: true },
    });

    if (!match) {
      return { error: "Match non trouvé" };
    }

    if (match.status !== "IN_PROGRESS") {
      return { error: "Match déjà terminé" };
    }

    if (scoreTeamA === scoreTeamB) {
      return { error: "Le score ne peut pas être égal" };
    }

    // Déterminer les gagnants et perdants
    const winningTeam: Team = scoreTeamA > scoreTeamB ? "TEAM_A" : "TEAM_B";
    const winners = match.players.filter(
      (p: { team: string }) => p.team === winningTeam
    );
    const losers = match.players.filter(
      (p: { team: string }) => p.team !== winningTeam
    );

    // Récupérer les ELO ratings
    const allPlayerIds = match.players.map((p: { userId: string }) => p.userId);
    const eloRatings = await prisma.eloRating.findMany({
      where: {
        userId: { in: allPlayerIds },
        leagueId: match.leagueId,
      },
    });

    const winnersElo = winners.map(
      (w: { userId: string }) =>
        eloRatings.find((e: { userId: string }) => e.userId === w.userId)
          ?.rating || 1000
    );
    const losersElo = losers.map(
      (l: { userId: string }) =>
        eloRatings.find((e: { userId: string }) => e.userId === l.userId)
          ?.rating || 1000
    );

    const avgWinnersElo =
      winnersElo.reduce((a: number, b: number) => a + b, 0) / winnersElo.length;
    const avgLosersElo =
      losersElo.reduce((a: number, b: number) => a + b, 0) / losersElo.length;

    // Calcul Elo
    const expectedWin =
      1 / (1 + Math.pow(10, (avgLosersElo - avgWinnersElo) / 400));
    const kFactor = 32;
    const eloChange = Math.round(kFactor * (1 - expectedWin));

    // Mettre à jour le match et les Elo
    await prisma.$transaction([
      prisma.match.update({
        where: { id: matchId },
        data: {
          scoreTeamA,
          scoreTeamB,
          status: "FINISHED",
          finishedAt: new Date(),
        },
      }),
      ...winners.map((winner: { userId: string }) =>
        prisma.eloRating.update({
          where: {
            userId_leagueId: {
              userId: winner.userId,
              leagueId: match.leagueId,
            },
          },
          data: {
            rating: { increment: eloChange },
            matchesWon: { increment: 1 },
          },
        })
      ),
      ...losers.map((loser: { userId: string }) =>
        prisma.eloRating.update({
          where: {
            userId_leagueId: {
              userId: loser.userId,
              leagueId: match.leagueId,
            },
          },
          data: {
            rating: { decrement: eloChange },
            matchesLost: { increment: 1 },
          },
        })
      ),
      ...match.players.map((player: { userId: string }) =>
        prisma.eloChange.create({
          data: {
            matchId,
            eloRatingId:
              eloRatings.find(
                (e: { userId: string }) => e.userId === player.userId
              )?.id || "",
            ratingBefore:
              eloRatings.find(
                (e: { userId: string }) => e.userId === player.userId
              )?.rating || 1000,
            ratingAfter: winners.some(
              (w: { userId: string }) => w.userId === player.userId
            )
              ? (eloRatings.find(
                  (e: { userId: string }) => e.userId === player.userId
                )?.rating || 1000) + eloChange
              : (eloRatings.find(
                  (e: { userId: string }) => e.userId === player.userId
                )?.rating || 1000) - eloChange,
            change: winners.some(
              (w: { userId: string }) => w.userId === player.userId
            )
              ? eloChange
              : -eloChange,
          },
        })
      ),
    ]);

    revalidatePath(`/leagues/${match.leagueId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur finalisation match:", error);
    return { error: "Erreur lors de la finalisation" };
  }
}

export async function deleteMatch(matchId: string) {
  const user = await getUserFromCookies();

  if (!user) {
    return { error: "Non authentifié" };
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { league: true },
    });

    if (!match) {
      return { error: "Match non trouvé" };
    }

    if (match.status === "FINISHED") {
      return { error: "Impossible de supprimer un match terminé" };
    }

    const membership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: user.userId,
          leagueId: match.leagueId,
        },
      },
    });

    if (!membership) {
      return { error: "Accès refusé" };
    }

    // Supprimer les joueurs puis le match
    await prisma.matchPlayer.deleteMany({
      where: { matchId },
    });

    await prisma.match.delete({
      where: { id: matchId },
    });

    revalidatePath(`/leagues/${match.leagueId}`);

    return { success: true, leagueId: match.leagueId };
  } catch (error) {
    console.error("Erreur suppression match:", error);
    return { error: "Erreur lors de la suppression" };
  }
}

export async function recordGoal(matchId: string, team: Team) {
  const user = await getUserFromCookies();

  if (!user) {
    return { error: "Non authentifié" };
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: { include: { user: true } } },
    });

    if (!match) {
      return { error: "Match non trouvé" };
    }

    if (match.status !== "IN_PROGRESS") {
      return { error: "Match non en cours" };
    }

    // Mettre à jour le score
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        [team === "TEAM_A" ? "scoreTeamA" : "scoreTeamB"]: { increment: 1 },
      },
      include: { players: { include: { user: true } } },
    });

    revalidatePath(`/leagues/${match.leagueId}/match/${matchId}`);

    return {
      success: true,
      match: {
        id: updatedMatch.id,
        scoreTeamA: updatedMatch.scoreTeamA,
        scoreTeamB: updatedMatch.scoreTeamB,
      },
    };
  } catch (error) {
    console.error("Erreur enregistrement but:", error);
    return { error: "Erreur lors de l'enregistrement du but" };
  }
}
