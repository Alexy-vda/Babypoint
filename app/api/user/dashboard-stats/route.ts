import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";

// GET /api/user/dashboard-stats - Statistiques globales pour le dashboard
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer toutes les ligues de l'utilisateur
    const memberships = await prisma.leagueMembership.findMany({
      where: { userId: user.userId },
      include: {
        league: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (memberships.length === 0) {
      return NextResponse.json({
        stats: null,
        message: "Aucune ligue rejointe",
      });
    }

    // Prendre la première ligue (ou celle qui a le plus d'activité)
    const primaryLeagueId = memberships[0].league.id;

    // Récupérer le rating Elo
    const eloRating = await prisma.eloRating.findUnique({
      where: {
        userId_leagueId: {
          userId: user.userId,
          leagueId: primaryLeagueId,
        },
      },
    });

    // Récupérer le classement de la ligue
    const leaderboard = await prisma.eloRating.findMany({
      where: { leagueId: primaryLeagueId },
      orderBy: { rating: "desc" },
      select: {
        userId: true,
        rating: true,
      },
    });

    // Trouver la position de l'utilisateur
    const userPosition =
      leaderboard.findIndex(
        (entry: { userId: string; rating: number }) =>
          entry.userId === user.userId
      ) + 1;

    // Récupérer tous les matchs de l'utilisateur
    const allMatches = await prisma.matchPlayer.findMany({
      where: {
        userId: user.userId,
        match: {
          leagueId: primaryLeagueId,
          status: "FINISHED",
        },
      },
      include: {
        match: {
          select: {
            id: true,
            scoreTeamA: true,
            scoreTeamB: true,
            finishedAt: true,
          },
        },
      },
      orderBy: {
        match: {
          finishedAt: "desc",
        },
      },
      take: 30, // Derniers 30 matchs
    });

    // Calculer wins/losses et la série
    let wins = 0;
    let losses = 0;
    const matchResults: ("W" | "L")[] = [];

    allMatches.forEach(
      (mp: {
        team: string;
        match: { scoreTeamA: number; scoreTeamB: number };
      }) => {
        const match = mp.match;
        const teamAWon = match.scoreTeamA > match.scoreTeamB;
        const playerWon =
          (mp.team === "TEAM_A" && teamAWon) ||
          (mp.team === "TEAM_B" && !teamAWon);

        if (playerWon) {
          wins++;
          matchResults.push("W");
        } else {
          losses++;
          matchResults.push("L");
        }
      }
    );

    // Calculer la série actuelle
    let currentStreak = 0;
    let streakType: "W" | "L" | null = null;
    for (let i = 0; i < matchResults.length; i++) {
      if (i === 0) {
        streakType = matchResults[i];
        currentStreak = 1;
      } else if (matchResults[i] === streakType) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Meilleur coéquipier (le plus de matchs ensemble)
    const teammateStats: Record<
      string,
      { name: string; wins: number; total: number }
    > = {};

    const allMatchesWithPlayers = await prisma.matchPlayer.findMany({
      where: {
        userId: user.userId,
        match: {
          leagueId: primaryLeagueId,
          status: "FINISHED",
          type: "TWO_V_TWO", // Seulement en 2v2
        },
      },
      include: {
        match: {
          include: {
            players: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    allMatchesWithPlayers.forEach(
      (mp: {
        team: string;
        match: {
          scoreTeamA: number;
          scoreTeamB: number;
          players: Array<{
            userId: string;
            team: string;
            user: { id: string; username: string; displayName: string | null };
          }>;
        };
      }) => {
        const match = mp.match;
        const playerTeam = mp.team;
        const teamAWon = match.scoreTeamA > match.scoreTeamB;
        const playerWon =
          (playerTeam === "TEAM_A" && teamAWon) ||
          (playerTeam === "TEAM_B" && !teamAWon);

        match.players.forEach(
          (p: {
            userId: string;
            team: string;
            user: { username: string; displayName: string | null };
          }) => {
            if (p.userId === user.userId || p.team !== playerTeam) return;

            const name = p.user.displayName || p.user.username;

            if (!teammateStats[p.userId]) {
              teammateStats[p.userId] = { name, wins: 0, total: 0 };
            }

            teammateStats[p.userId].total++;
            if (playerWon) {
              teammateStats[p.userId].wins++;
            }
          }
        );
      }
    );

    const bestTeammate = Object.entries(teammateStats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([userId, stats]) => ({
        userId,
        name: stats.name,
        matches: stats.total,
        winRate: ((stats.wins / stats.total) * 100).toFixed(0),
      }))[0];

    return NextResponse.json({
      stats: {
        leagueName: memberships[0].league.name,
        leagueId: primaryLeagueId,
        rating: eloRating?.rating || 1000,
        position: userPosition,
        totalPlayers: leaderboard.length,
        wins,
        losses,
        totalMatches: wins + losses,
        winRate:
          wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0",
        currentStreak: {
          count: currentStreak,
          type: streakType,
        },
        matchHistory: matchResults.reverse(), // Inverser pour avoir du plus ancien au plus récent
        bestTeammate: bestTeammate || null,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des stats du dashboard:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
