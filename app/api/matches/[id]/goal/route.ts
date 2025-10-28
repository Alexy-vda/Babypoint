import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/matches/[id]/goal - Marquer un but
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { team, scorerId } = body;

    if (!team || !["TEAM_A", "TEAM_B"].includes(team)) {
      return NextResponse.json({ error: "Équipe invalide" }, { status: 400 });
    }

    // Récupérer le match
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        league: true,
        players: {
          include: {
            user: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }

    if (match.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Le match n'est pas en cours" },
        { status: 400 }
      );
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

    // Vérifier que le scoreur fait partie de l'équipe
    if (scorerId) {
      const scorer = match.players.find(
        (p: { userId: string; team: string }) => p.userId === scorerId
      );
      if (!scorer || scorer.team !== team) {
        return NextResponse.json(
          { error: "Le joueur ne fait pas partie de cette équipe" },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le score
    const newScoreA =
      team === "TEAM_A" ? match.scoreTeamA + 1 : match.scoreTeamA;
    const newScoreB =
      team === "TEAM_B" ? match.scoreTeamB + 1 : match.scoreTeamB;

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        scoreTeamA: newScoreA,
        scoreTeamB: newScoreB,
      },
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
    });

    // Trouver le nom du buteur
    let scorerName = "Équipe";
    if (scorerId) {
      const scorer = match.players.find(
        (p: { userId: string }) => p.userId === scorerId
      );
      if (scorer) {
        scorerName = scorer.user.displayName || scorer.user.username;
      }
    }

    // Créer l'événement de log
    const event = {
      type: "goal",
      team,
      scorerId,
      scorerName,
      scoreA: newScoreA,
      scoreB: newScoreB,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      match: updatedMatch,
      event,
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du but:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
