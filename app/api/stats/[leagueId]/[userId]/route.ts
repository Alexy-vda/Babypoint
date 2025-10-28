import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";

interface RouteParams {
  params: Promise<{
    leagueId: string;
    userId: string;
  }>;
}

// GET /api/stats/[leagueId]/[userId] - Statistiques détaillées d'un joueur
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { leagueId, userId } = await params;

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
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer le joueur
    const player = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Joueur non trouvé" }, { status: 404 });
    }

    // Rating Elo
    const eloRating = await prisma.eloRating.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        },
      },
    });

    // Tous les matchs du joueur dans cette ligue
    const allMatches = await prisma.matchPlayer.findMany({
      where: {
        userId,
        match: {
          leagueId,
          status: "FINISHED",
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

    // Statistiques par coéquipiers et adversaires
    const teammateStats: Record<
      string,
      { name: string; wins: number; losses: number; matches: number }
    > = {};
    const opponentStats: Record<
      string,
      { name: string; wins: number; losses: number; matches: number }
    > = {};

    allMatches.forEach(
      (mp: {
        match: {
          scoreTeamA: number;
          scoreTeamB: number;
          players: {
            userId: string;
            team: string;
            user: { username: string; displayName: string | null };
          }[];
        };
        team: string;
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
            if (p.userId === userId) return; // Skip le joueur lui-même

            const name = p.user.displayName || p.user.username;

            if (p.team === playerTeam) {
              // Coéquipier
              if (!teammateStats[p.userId]) {
                teammateStats[p.userId] = {
                  name,
                  wins: 0,
                  losses: 0,
                  matches: 0,
                };
              }
              teammateStats[p.userId].matches++;
              if (playerWon) {
                teammateStats[p.userId].wins++;
              } else {
                teammateStats[p.userId].losses++;
              }
            } else {
              // Adversaire
              if (!opponentStats[p.userId]) {
                opponentStats[p.userId] = {
                  name,
                  wins: 0,
                  losses: 0,
                  matches: 0,
                };
              }
              opponentStats[p.userId].matches++;
              if (playerWon) {
                opponentStats[p.userId].wins++;
              } else {
                opponentStats[p.userId].losses++;
              }
            }
          }
        );
      }
    );

    // Trier par nombre de matchs
    const topTeammates = Object.entries(teammateStats)
      .sort((a, b) => b[1].matches - a[1].matches)
      .slice(0, 5)
      .map(([userId, stats]) => ({
        userId,
        ...stats,
        winRate: ((stats.wins / stats.matches) * 100).toFixed(1),
      }));

    const topOpponents = Object.entries(opponentStats)
      .sort((a, b) => b[1].matches - a[1].matches)
      .slice(0, 5)
      .map(([userId, stats]) => ({
        userId,
        ...stats,
        winRate: ((stats.wins / stats.matches) * 100).toFixed(1),
      }));

    // Historique Elo
    const eloHistory = await prisma.eloChange.findMany({
      where: {
        eloRating: {
          userId,
          leagueId,
        },
      },
      include: {
        match: {
          select: {
            id: true,
            startedAt: true,
            finishedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json({
      player,
      rating: eloRating,
      totalMatches: allMatches.length,
      topTeammates,
      topOpponents,
      eloHistory,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
