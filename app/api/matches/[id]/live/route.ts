import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/matches/[id]/live - Récupérer l'état actuel du match en direct
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        players: {
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
            team: "asc",
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est membre de la ligue
    const membership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: user.userId,
          leagueId: match.leagueId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Retourner l'état du match
    return NextResponse.json({
      match: {
        id: match.id,
        status: match.status,
        type: match.type,
        scoreTeamA: match.scoreTeamA,
        scoreTeamB: match.scoreTeamB,
        startedAt: match.startedAt,
        finishedAt: match.finishedAt,
        players: match.players,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du match live:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
