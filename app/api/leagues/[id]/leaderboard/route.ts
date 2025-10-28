import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/leagues/[id]/leaderboard - Récupérer le classement Elo d'une ligue
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que l'utilisateur est membre de la ligue
    const membership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: user.userId,
          leagueId: id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les ratings Elo de tous les membres
    const leaderboard = await prisma.eloRating.findMany({
      where: {
        leagueId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        rating: "desc",
      },
    });

    // Enrichir avec les statistiques
    const enrichedLeaderboard = leaderboard.map(
      (
        entry: {
          user: {
            id: string;
            username: string;
            displayName: string | null;
            avatar: string | null;
          };
          rating: number;
          matchesWon: number;
          matchesLost: number;
          winStreak: number;
          bestStreak: number;
        },
        index: number
      ) => ({
        rank: index + 1,
        userId: entry.user.id,
        username: entry.user.username,
        displayName: entry.user.displayName,
        avatar: entry.user.avatar,
        rating: entry.rating,
        matchesWon: entry.matchesWon,
        matchesLost: entry.matchesLost,
        totalMatches: entry.matchesWon + entry.matchesLost,
        winRate:
          entry.matchesWon + entry.matchesLost > 0
            ? (
                (entry.matchesWon / (entry.matchesWon + entry.matchesLost)) *
                100
              ).toFixed(1)
            : "0.0",
        currentStreak: entry.winStreak,
        bestStreak: entry.bestStreak,
      })
    );

    return NextResponse.json({ leaderboard: enrichedLeaderboard });
  } catch (error) {
    console.error("Erreur lors de la récupération du classement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
