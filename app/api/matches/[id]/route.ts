import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";
import { updateMatchScoreSchema } from "@/lib/validations";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/matches/[id] - Récupérer un match spécifique
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
        league: {
          select: {
            id: true,
            name: true,
          },
        },
        eloChanges: {
          include: {
            eloRating: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Erreur lors de la récupération du match:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/matches/[id] - Mettre à jour le score
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateMatchScoreSchema.parse(body);

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        players: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }

    if (match.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Impossible de modifier un match terminé" },
        { status: 400 }
      );
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        scoreTeamA: validatedData.scoreTeamA,
        scoreTeamB: validatedData.scoreTeamB,
      },
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
        },
      },
    });

    return NextResponse.json({ match: updatedMatch });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la mise à jour du match:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/matches/[id] - Supprimer un match en cours
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer le match
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        league: true,
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
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de cette ligue" },
        { status: 403 }
      );
    }

    // Vérifier que le match est en cours (on ne peut supprimer que les matchs non terminés)
    if (match.status === "FINISHED") {
      return NextResponse.json(
        { error: "Impossible de supprimer un match terminé" },
        { status: 400 }
      );
    }

    // Supprimer les joueurs du match d'abord (relation)
    await prisma.matchPlayer.deleteMany({
      where: { matchId: id },
    });

    // Supprimer le match
    await prisma.match.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Match supprimé" });
  } catch (error) {
    console.error("Erreur lors de la suppression du match:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du match" },
      { status: 500 }
    );
  }
}
