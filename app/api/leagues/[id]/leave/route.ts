import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/leagues/[id]/leave - Quitter une ligue
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: leagueId } = await params;

    // Vérifier que l'utilisateur est membre de cette ligue
    const membership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: user.userId,
          leagueId,
        },
      },
      include: {
        league: {
          select: {
            ownerId: true,
            name: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de cette ligue" },
        { status: 404 }
      );
    }

    // Empêcher le propriétaire de quitter sa propre ligue
    if (membership.league.ownerId === user.userId) {
      return NextResponse.json(
        {
          error:
            "Vous ne pouvez pas quitter une ligue dont vous êtes le créateur. Supprimez la ligue ou transférez la propriété d'abord.",
        },
        { status: 403 }
      );
    }

    // Supprimer le membership
    await prisma.leagueMembership.delete({
      where: {
        userId_leagueId: {
          userId: user.userId,
          leagueId,
        },
      },
    });

    return NextResponse.json({
      message: `Vous avez quitté la ligue "${membership.league.name}"`,
    });
  } catch (error) {
    console.error("Erreur lors de la sortie de la ligue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
